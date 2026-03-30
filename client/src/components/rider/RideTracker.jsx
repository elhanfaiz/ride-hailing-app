import { motion } from "framer-motion";
import { CarFront, Clock3, MapPin, Route, ShieldCheck, Sparkles } from "lucide-react";
import { Card } from "../common/Card";
import { LiveMap } from "../common/LiveMap";
import { Skeleton } from "../common/Skeleton";
import { StatusBadge } from "../common/StatusBadge";

export const RideTracker = ({
  ride,
  liveLocation,
  etaMinutes,
  nearbyDrivers = [],
  loading = false,
  onEtaUpdate,
}) => {
  if (loading && !ride) {
    return (
      <Card className="space-y-5">
        <Skeleton className="h-7 w-36" />
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-[420px] w-full rounded-[2rem]" />
        <div className="grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      </Card>
    );
  }

  if (!ride) {
    return (
      <Card className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="pill">Live trip overview</p>
            <h3 className="mt-4 font-display text-3xl font-bold text-white">
              Nearby drivers are ready
            </h3>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">
              Preview the service area, compare nearby drivers, and book when you are
              ready. Once a driver accepts, this panel becomes your live trip tracker.
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-3 text-right">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Live fleet</p>
            <p className="mt-2 text-2xl font-bold text-white">{nearbyDrivers.length}</p>
          </div>
        </div>

        <LiveMap nearbyDrivers={nearbyDrivers} testId="rider-live-map" />

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <Sparkles size={16} />
              Driver discovery
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              See active drivers before you book to get a clearer feel for supply near
              your pickup point.
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <ShieldCheck size={16} />
              Road-aware routing
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Map routes snap to actual roads and update ETA dynamically as the driver
              moves.
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <Clock3 size={16} />
              Arrival timing
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Your ride card turns into a live ETA tracker the moment your trip is
              accepted.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="pill">Current ride</p>
            <h3 className="mt-4 font-display text-3xl font-bold text-white">
              {ride.pickup.address} to {ride.dropoff.address}
            </h3>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Follow your driver in real time with road-snapped navigation and live ETA.
            </p>
          </div>
          <StatusBadge status={ride.status} data-testid="ride-status-badge" />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-[1.6rem] border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <CarFront size={16} />
              Driver
            </div>
            <p className="mt-3 text-lg font-semibold text-white">
              {ride.driver?.fullName || "Looking for a driver"}
            </p>
            <p className="text-sm text-slate-400">
              {ride.driver?.vehicle?.make} {ride.driver?.vehicle?.model} -{" "}
              {ride.driver?.vehicle?.plateNumber}
            </p>
          </div>
          <div className="rounded-[1.6rem] border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <Route size={16} />
              Trip fare
            </div>
            <p className="mt-3 text-lg font-semibold text-white">${ride.fare?.total || 0}</p>
            <p className="text-sm text-slate-400">
              {ride.fare?.distanceKm || 0} km - {ride.fare?.durationMinutes || 0} mins
            </p>
          </div>
          <div className="rounded-[1.6rem] border border-accent/20 bg-accent/10 p-4">
            <div className="flex items-center gap-2 text-sm text-slate-200">
              <Clock3 size={16} />
              Live ETA
            </div>
            <p data-testid="rider-live-eta" className="mt-3 text-lg font-semibold text-white">
              {etaMinutes ? `${etaMinutes} mins` : "Calculating"}
            </p>
            <p className="text-sm text-slate-300">
              Updated automatically using current route conditions
            </p>
          </div>
        </div>

        <div className="rounded-[1.9rem] border border-white/10 bg-slate-950/60 p-4 sm:p-5">
          <div className="mb-4 flex items-center gap-2 text-slate-200">
            <MapPin size={16} />
            Live driver route
          </div>
          <LiveMap
            pickup={ride.pickup}
            dropoff={ride.dropoff}
            driverLocation={liveLocation}
            nearbyDrivers={nearbyDrivers}
            status={ride.status}
            onEtaUpdate={onEtaUpdate}
            testId="rider-live-map"
          />
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="rounded-[1.4rem] bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                Driver latitude
              </p>
              <p data-testid="rider-driver-latitude" className="mt-2 text-base font-semibold text-white">
                {liveLocation?.lat ?? ride.driver?.currentLocation?.lat ?? "n/a"}
              </p>
            </div>
            <div className="rounded-[1.4rem] bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                Driver longitude
              </p>
              <p data-testid="rider-driver-longitude" className="mt-2 text-base font-semibold text-white">
                {liveLocation?.lng ?? ride.driver?.currentLocation?.lng ?? "n/a"}
              </p>
            </div>
            <div className="rounded-[1.4rem] bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                Arrival state
              </p>
              <p data-testid="rider-arrival-state" className="mt-2 text-base font-semibold text-white">
                {ride.status?.replaceAll("_", " ")}
              </p>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
