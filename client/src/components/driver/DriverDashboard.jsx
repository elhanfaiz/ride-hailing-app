import { motion } from "framer-motion";
import { CarFront, DollarSign, Map, Power, Route, Users } from "lucide-react";
import { Button } from "../common/Button";
import { Card } from "../common/Card";
import { LiveMap } from "../common/LiveMap";
import { Skeleton } from "../common/Skeleton";
import { StatusBadge } from "../common/StatusBadge";

const MetricCard = ({ icon: Icon, label, value, tone = "text-white" }) => (
  <Card className="bg-white/6">
    <div className="flex items-center gap-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-accent">
        <Icon size={18} />
      </div>
      <div>
        <p className="text-sm text-slate-400">{label}</p>
        <p className={`text-2xl font-bold ${tone}`}>{value}</p>
      </div>
    </div>
  </Card>
);

export const DriverDashboard = ({
  dashboard,
  activeRide,
  driverLocation,
  etaMinutes,
  onToggleOnline,
  onRespondToRide,
  onRideAction,
  online,
  loading = false,
  onEtaUpdate,
}) => {
  if (loading && !dashboard) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <Skeleton className="h-[620px]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          icon={DollarSign}
          label="Earnings"
          value={`$${dashboard?.stats?.earnings || 0}`}
        />
        <MetricCard
          icon={Route}
          label="Trips"
          value={dashboard?.stats?.totalTrips || 0}
          tone="text-sky-200"
        />
        <MetricCard
          icon={Users}
          label="Rating"
          value={dashboard?.stats?.rating || 0}
          tone="text-amber-200"
        />
      </div>

      <Card className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="pill">Driver console</p>
            <h2 className="mt-4 font-display text-3xl font-bold text-white">
              Stay online and follow the route in real time
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Accept requests, track the snapped road route, and keep riders updated with
              smooth live movement.
            </p>
          </div>
          <Button
            onClick={onToggleOnline}
            variant={online ? "secondary" : "primary"}
            data-testid="driver-toggle-online"
          >
            <Power size={16} className="mr-2" />
            {online ? "Go offline" : "Go online"}
          </Button>
        </div>

        {activeRide ? (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            <div className="grid gap-4 lg:grid-cols-[1fr,0.95fr]">
              <div className="rounded-[1.8rem] border border-white/10 bg-white/5 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-slate-400">Current trip</p>
                    <p className="mt-2 text-xl font-semibold text-white">
                      {activeRide.pickup.address} to {activeRide.dropoff.address}
                    </p>
                  </div>
                  <StatusBadge status={activeRide.status} data-testid="driver-ride-status" />
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-[1.3rem] bg-slate-950/60 p-4">
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <CarFront size={15} />
                      Rider pickup
                    </div>
                    <p className="mt-2 text-sm font-medium text-white">{activeRide.pickup.address}</p>
                  </div>
                  <div className="rounded-[1.3rem] bg-slate-950/60 p-4">
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <Map size={15} />
                      Destination
                    </div>
                    <p className="mt-2 text-sm font-medium text-white">{activeRide.dropoff.address}</p>
                  </div>
                  <div className="rounded-[1.3rem] bg-accent/10 p-4">
                    <div className="flex items-center gap-2 text-sm text-slate-200">
                      <Route size={15} />
                      ETA
                    </div>
                    <p data-testid="driver-live-eta" className="mt-2 text-sm font-medium text-white">
                      {etaMinutes ? `${etaMinutes} mins` : "Updating..."}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  {activeRide.status === "searching" && (
                    <>
                      <Button
                        onClick={() => onRespondToRide(activeRide._id, "accept")}
                        data-testid="accept-ride-button"
                      >
                        Accept ride
                      </Button>
                      <Button
                        variant="ghost"
                        data-testid="reject-ride-button"
                        onClick={() => onRespondToRide(activeRide._id, "reject")}
                      >
                        Reject ride
                      </Button>
                    </>
                  )}
                  {activeRide.status === "driver_assigned" && (
                    <Button
                      onClick={() => onRideAction(activeRide._id, "driver_arriving")}
                      data-testid="start-arriving-button"
                    >
                      Start arriving
                    </Button>
                  )}
                  {activeRide.status === "driver_arriving" && (
                    <Button
                      onClick={() => onRideAction(activeRide._id, "in_progress")}
                      data-testid="begin-trip-button"
                    >
                      Begin trip
                    </Button>
                  )}
                  {activeRide.status === "in_progress" && (
                    <Button
                      onClick={() => onRideAction(activeRide._id, "completed")}
                      data-testid="complete-ride-button"
                    >
                      Complete ride
                    </Button>
                  )}
                </div>
              </div>

              <div className="rounded-[1.8rem] border border-white/10 bg-white/5 p-5">
                <p className="text-sm text-slate-400">Driver telemetry</p>
                <div className="mt-4 grid gap-3">
                  <div className="rounded-[1.2rem] bg-slate-950/60 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Latitude</p>
                    <p className="mt-2 font-semibold text-white">{driverLocation?.lat ?? "n/a"}</p>
                  </div>
                  <div className="rounded-[1.2rem] bg-slate-950/60 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Longitude</p>
                    <p className="mt-2 font-semibold text-white">{driverLocation?.lng ?? "n/a"}</p>
                  </div>
                  <div className="rounded-[1.2rem] bg-slate-950/60 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Network state</p>
                    <p className="mt-2 font-semibold text-white">
                      {online ? "Online and broadcasting" : "Offline"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <LiveMap
              pickup={activeRide.pickup}
              dropoff={activeRide.dropoff}
              driverLocation={driverLocation}
              status={activeRide.status}
              onEtaUpdate={onEtaUpdate}
              testId="driver-live-map"
            />
          </motion.div>
        ) : (
          <div className="rounded-[2rem] border border-dashed border-white/10 p-8 text-center text-slate-400">
            No active ride yet. Stay online and the dashboard will turn into a live
            navigation console when a request comes in.
          </div>
        )}
      </Card>
    </div>
  );
};
