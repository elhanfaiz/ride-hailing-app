import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import api from "../api/axios";
import { DriverDashboard } from "../components/driver/DriverDashboard";
import { useSocket } from "../context/SocketContext";
import { useAuth } from "../context/AuthContext";

const LOCATION_EMIT_INTERVAL = 2000;

const moveTowardTarget = (origin, target) => {
  if (!origin || !target) return origin;

  const latDiff = target.lat - origin.lat;
  const lngDiff = target.lng - origin.lng;

  return {
    lat: Number((origin.lat + latDiff * 0.18).toFixed(6)),
    lng: Number((origin.lng + lngDiff * 0.18).toFixed(6)),
    address: "Simulated driver route",
  };
};

const getBrowserLocation = () =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          lat: Number(position.coords.latitude.toFixed(6)),
          lng: Number(position.coords.longitude.toFixed(6)),
          address: "Browser geolocation",
        }),
      reject,
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 4000,
      }
    );
  });

export const DriverPage = () => {
  const { socket, emitDriverLocation } = useSocket();
  const { auth, refreshProfile } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [activeRide, setActiveRide] = useState(null);
  const [online, setOnline] = useState(auth.account?.isOnline || false);
  const [driverLocation, setDriverLocation] = useState(
    auth.account?.currentLocation || null
  );
  const [etaMinutes, setEtaMinutes] = useState(null);
  const [loading, setLoading] = useState(true);
  const locationRef = useRef(auth.account?.currentLocation || null);
  const handleEtaUpdate = useCallback(
    ({ etaMinutes: nextEtaMinutes }) => setEtaMinutes(nextEtaMinutes),
    []
  );

  const loadData = async () => {
    setLoading(true);
    try {
      const [dashboardResponse, ridesResponse] = await Promise.all([
        api.get("/drivers/dashboard"),
        api.get("/drivers/rides"),
      ]);

      setDashboard(dashboardResponse.data.data);
      setDriverLocation(dashboardResponse.data.data.driver?.currentLocation || null);
      locationRef.current = dashboardResponse.data.data.driver?.currentLocation || null;
      const ride = ridesResponse.data.data.find((item) =>
        ["searching", "driver_assigned", "driver_arriving", "in_progress"].includes(
          item.status
        )
      );
      setActiveRide(ride || null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!socket || !auth.account?._id) return undefined;

    const handleRideUpdate = (ride) => setActiveRide(ride);
    const handleNewRequest = (ride) => setActiveRide(ride);
    const handleDriverLocation = ({ location, etaMinutes: nextEtaMinutes }) => {
      setDriverLocation(location);
      setEtaMinutes(nextEtaMinutes || null);
      locationRef.current = location;
    };

    socket.on("ride:updated", handleRideUpdate);
    socket.on("ride:new-request", handleNewRequest);
    socket.on("ride:driver-location", handleDriverLocation);

    const interval = setInterval(async () => {
      if (!online || !auth.account?._id || !activeRide) return;

      const currentLocation =
        locationRef.current ||
        auth.account?.currentLocation || {
          lat: 24.8607,
          lng: 67.0011,
          address: "Karachi",
        };

      const target =
        activeRide.status === "in_progress" ? activeRide.dropoff : activeRide.pickup;

      let nextLocation = null;

      try {
        nextLocation = await getBrowserLocation();
      } catch (_error) {
        nextLocation = moveTowardTarget(currentLocation, target);
      }

      setDriverLocation(nextLocation);
      locationRef.current = nextLocation;

      emitDriverLocation({
        driverId: auth.account._id,
        rideId: activeRide?._id,
        location: nextLocation,
      });
    }, LOCATION_EMIT_INTERVAL);

    return () => {
      socket.off("ride:updated", handleRideUpdate);
      socket.off("ride:new-request", handleNewRequest);
      socket.off("ride:driver-location", handleDriverLocation);
      clearInterval(interval);
    };
  }, [
    socket,
    online,
    auth.account?._id,
    auth.account?.currentLocation,
    activeRide,
    emitDriverLocation,
  ]);

  const effectiveDriverLocation = useMemo(
    () =>
      driverLocation || dashboard?.driver?.currentLocation || auth.account?.currentLocation,
    [driverLocation, dashboard?.driver?.currentLocation, auth.account?.currentLocation]
  );

  const toggleOnline = async () => {
    const nextOnline = !online;
    await api.patch("/drivers/availability", { isOnline: nextOnline });
    setOnline(nextOnline);
    await refreshProfile();
  };

  const handleRideAction = async (rideId, status) => {
    await api.patch(`/drivers/rides/${rideId}/status`, { status });
    await loadData();
  };

  const handleRespondToRide = async (rideId, action) => {
    await api.patch(`/drivers/rides/${rideId}/respond`, { action });
    await loadData();
  };

  return (
    <DriverDashboard
      dashboard={dashboard}
      activeRide={activeRide}
      driverLocation={effectiveDriverLocation}
      etaMinutes={etaMinutes}
      onToggleOnline={toggleOnline}
      onRespondToRide={handleRespondToRide}
      onRideAction={handleRideAction}
      online={online}
      loading={loading}
      onEtaUpdate={handleEtaUpdate}
    />
  );
};
