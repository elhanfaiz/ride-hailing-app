import { useCallback, useEffect, useState } from "react";
import api from "../api/axios";
import { BookingPanel } from "../components/rider/BookingPanel";
import { RideTracker } from "../components/rider/RideTracker";
import { useSocket } from "../context/SocketContext";
import { normalizeRideForm } from "../utils/rideForm";

export const HomePage = () => {
  const { socket, subscribeToRide } = useSocket();
  const [estimate, setEstimate] = useState(null);
  const [activeRide, setActiveRide] = useState(null);
  const [liveLocation, setLiveLocation] = useState(null);
  const [etaMinutes, setEtaMinutes] = useState(null);
  const [nearbyDrivers, setNearbyDrivers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [error, setError] = useState("");
  const handleEtaUpdate = useCallback(
    ({ etaMinutes: nextEtaMinutes }) => setEtaMinutes(nextEtaMinutes),
    []
  );

  const fetchRides = async () => {
    try {
      const { data } = await api.get("/rides");
      const [latestRide] = data.data;
      setActiveRide(latestRide || null);
    } catch (requestError) {
      console.error("[HomePage] failed to fetch rides", requestError.response?.data);
    } finally {
      setBootstrapping(false);
    }
  };

  useEffect(() => {
    fetchRides();
  }, []);

  useEffect(() => {
    if (!socket) return undefined;

    const handleRideUpdate = (ride) => {
      setActiveRide(ride);
      subscribeToRide(ride._id);
    };

    const handleDriverLocation = ({ location, etaMinutes: nextEtaMinutes }) => {
      setLiveLocation(location);
      setEtaMinutes(nextEtaMinutes || null);
    };

    socket.on("ride:created", handleRideUpdate);
    socket.on("ride:updated", handleRideUpdate);
    socket.on("ride:driver-location", handleDriverLocation);

    return () => {
      socket.off("ride:created", handleRideUpdate);
      socket.off("ride:updated", handleRideUpdate);
      socket.off("ride:driver-location", handleDriverLocation);
    };
  }, [socket, subscribeToRide]);

  useEffect(() => {
    if (!activeRide?._id || !socket) return;
    subscribeToRide(activeRide._id);
  }, [activeRide?._id, socket, subscribeToRide]);

  const handleEstimate = async (form) => {
    setLoading(true);
    setError("");

    const normalizedForm = normalizeRideForm(form);

    if (!normalizedForm.pickup.address || !normalizedForm.dropoff.address) {
      setError("Pickup and dropoff locations are required before estimating a fare.");
      setLoading(false);
      return;
    }

    console.log("[HomePage] estimate payload", normalizedForm);

    try {
      const [estimateResponse, nearbyResponse] = await Promise.all([
        api.post("/rides/estimate", {
          pickup: normalizedForm.pickup,
          dropoff: normalizedForm.dropoff,
        }),
        api.get("/drivers/nearby", {
          params: {
            lat: normalizedForm.pickup.lat,
            lng: normalizedForm.pickup.lng,
          },
        }),
      ]);

      setEstimate(estimateResponse.data.data);
      setNearbyDrivers(nearbyResponse.data.data);
    } catch (requestError) {
      const errorMessage =
        requestError.response?.data?.message ||
        "Unable to estimate fare right now. Please check your locations.";
      console.error("[HomePage] estimate failed", requestError.response?.data);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBook = async (form) => {
    setLoading(true);
    setError("");

    const normalizedForm = normalizeRideForm(form);

    if (!normalizedForm.pickup.address || !normalizedForm.dropoff.address) {
      setError("Pickup and dropoff locations are required before booking a ride.");
      setLoading(false);
      return;
    }

    console.log("[HomePage] create ride payload", normalizedForm);

    try {
      const normalizedPaymentMethod =
        normalizedForm.paymentMethod === "mock"
          ? "card"
          : normalizedForm.paymentMethod;
      const { data } = await api.post("/rides", {
        pickup: normalizedForm.pickup,
        dropoff: normalizedForm.dropoff,
        paymentMethod: normalizedPaymentMethod,
      });

      setActiveRide(data.data);

      if (
        normalizedForm.paymentMethod === "mock" ||
        normalizedForm.paymentMethod === "stripe"
      ) {
        await api.post("/payments", {
          rideId: data.data._id,
          provider: normalizedForm.paymentMethod,
        });
      }
    } catch (requestError) {
      const errorMessage =
        requestError.response?.data?.message ||
        "Unable to book the ride right now. Please try again.";
      console.error("[HomePage] booking failed", requestError.response?.data);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
        <BookingPanel
          onEstimate={handleEstimate}
          onBook={handleBook}
          estimate={estimate}
          loading={loading}
        />
        <RideTracker
          ride={activeRide}
          liveLocation={liveLocation}
          etaMinutes={etaMinutes}
          nearbyDrivers={!activeRide ? nearbyDrivers : []}
          loading={bootstrapping}
          onEtaUpdate={handleEtaUpdate}
        />
      </section>

      {error && (
        <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 px-5 py-4 text-sm text-rose-100">
          {error}
        </div>
      )}

      <section className="grid gap-6 lg:grid-cols-[0.85fr,1.15fr]">
        <div className="glass-card p-5 sm:p-6">
          <p className="pill">Nearby drivers</p>
          <h3 className="mt-4 font-display text-2xl font-bold text-white">
            Fleet around your pickup
          </h3>
          <div className="mt-5 space-y-3">
            {nearbyDrivers.length ? (
              nearbyDrivers.map((driver) => (
                <div
                  key={driver._id}
                  className="flex items-center justify-between rounded-[1.5rem] bg-white/5 p-4"
                >
                  <div>
                    <p className="font-semibold text-white">{driver.fullName}</p>
                    <p className="text-sm text-slate-400">
                      {driver.vehicle.make} {driver.vehicle.model}
                    </p>
                  </div>
                  <div className="text-right text-sm text-slate-300">
                    <p>{driver.distanceKm.toFixed(2)} km away</p>
                    <p>Rating {driver.rating}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-400">
                Run a fare estimate to discover online drivers around the pickup point.
              </p>
            )}
          </div>
        </div>

        <div className="glass-card p-5 sm:p-6">
          <p className="pill">Architecture in practice</p>
          <h2 className="mt-4 font-display text-3xl font-bold text-white">
            Real-time trip orchestration with a production-ready front end
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-[1.5rem] bg-white/5 p-4">
              <p className="text-sm text-slate-400">Auth</p>
              <p className="mt-2 font-semibold text-white">JWT + role middleware</p>
            </div>
            <div className="rounded-[1.5rem] bg-white/5 p-4">
              <p className="text-sm text-slate-400">Realtime</p>
              <p className="mt-2 font-semibold text-white">Smooth driver tracking + live ETA</p>
            </div>
            <div className="rounded-[1.5rem] bg-white/5 p-4">
              <p className="text-sm text-slate-400">Payments</p>
              <p className="mt-2 font-semibold text-white">Mock and optional Stripe</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
