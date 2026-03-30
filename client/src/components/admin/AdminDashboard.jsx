import { Card } from "../common/Card";
import { StatusBadge } from "../common/StatusBadge";

export const AdminDashboard = ({ dashboard, users, drivers, rides }) => (
  <div className="space-y-6">
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <p className="text-sm text-slate-400">Users</p>
        <p className="mt-2 text-3xl font-bold text-white">
          {dashboard?.metrics?.users || 0}
        </p>
      </Card>
      <Card>
        <p className="text-sm text-slate-400">Drivers</p>
        <p className="mt-2 text-3xl font-bold text-white">
          {dashboard?.metrics?.drivers || 0}
        </p>
      </Card>
      <Card>
        <p className="text-sm text-slate-400">Rides</p>
        <p className="mt-2 text-3xl font-bold text-white">
          {dashboard?.metrics?.rides || 0}
        </p>
      </Card>
      <Card>
        <p className="text-sm text-slate-400">Revenue</p>
        <p className="mt-2 text-3xl font-bold text-white">
          ${dashboard?.metrics?.totalRevenue || 0}
        </p>
      </Card>
    </div>

    <div className="grid gap-6 xl:grid-cols-[1.4fr,1fr]">
      <Card className="overflow-hidden">
        <h3 className="font-display text-2xl font-bold text-white">Recent rides</h3>
        <div className="mt-6 space-y-3">
          {rides?.slice(0, 8).map((ride) => (
            <div
              key={ride._id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white/5 p-4"
            >
              <div>
                <p className="font-semibold text-white">
                  {ride.rider?.fullName || "Unknown rider"}
                </p>
                <p className="text-sm text-slate-400">
                  {ride.pickup.address} to {ride.dropoff.address}
                </p>
              </div>
              <StatusBadge status={ride.status} />
            </div>
          ))}
        </div>
      </Card>

      <div className="space-y-6">
        <Card>
          <h3 className="font-display text-xl font-bold text-white">Latest users</h3>
          <div className="mt-4 space-y-3">
            {users?.slice(0, 5).map((user) => (
              <div key={user._id} className="rounded-2xl bg-white/5 p-3">
                <p className="font-semibold text-white">{user.fullName}</p>
                <p className="text-sm text-slate-400">{user.email}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="font-display text-xl font-bold text-white">Driver fleet</h3>
          <div className="mt-4 space-y-3">
            {drivers?.slice(0, 5).map((driver) => (
              <div key={driver._id} className="rounded-2xl bg-white/5 p-3">
                <p className="font-semibold text-white">{driver.fullName}</p>
                <p className="text-sm text-slate-400">
                  {driver.vehicle?.make} {driver.vehicle?.model} •{" "}
                  {driver.isOnline ? "Online" : "Offline"}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  </div>
);
