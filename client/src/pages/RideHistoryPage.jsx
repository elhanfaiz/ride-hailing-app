import { useEffect, useState } from "react";
import api from "../api/axios";
import { StatusBadge } from "../components/common/StatusBadge";

export const RideHistoryPage = () => {
  const [rides, setRides] = useState([]);

  useEffect(() => {
    const fetchRides = async () => {
      const { data } = await api.get("/rides");
      setRides(data.data);
    };

    fetchRides();
  }, []);

  return (
    <div className="glass-card p-6">
      <p className="pill">Ride history</p>
      <h1 className="mt-4 font-display text-3xl font-bold text-white">
        All of your previous trips
      </h1>
      <div className="mt-6 space-y-4">
        {rides.map((ride) => (
          <div
            key={ride._id}
            className="grid gap-3 rounded-3xl bg-white/5 p-5 md:grid-cols-[1.5fr,1fr,auto]"
          >
            <div>
              <p className="font-semibold text-white">
                {ride.pickup.address} to {ride.dropoff.address}
              </p>
              <p className="text-sm text-slate-400">
                Driver: {ride.driver?.fullName || "Unassigned"}
              </p>
            </div>
            <div>
              <p className="text-white">${ride.fare?.total || 0}</p>
              <p className="text-sm text-slate-400">
                {new Date(ride.createdAt).toLocaleString()}
              </p>
            </div>
            <StatusBadge status={ride.status} />
          </div>
        ))}
      </div>
    </div>
  );
};

