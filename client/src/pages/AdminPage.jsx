import { useEffect, useState } from "react";
import api from "../api/axios";
import { AdminDashboard } from "../components/admin/AdminDashboard";
import { useSocket } from "../context/SocketContext";

export const AdminPage = () => {
  const { socket } = useSocket();
  const [dashboard, setDashboard] = useState(null);
  const [users, setUsers] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [rides, setRides] = useState([]);

  const loadData = async () => {
    const [dashboardResponse, usersResponse, driversResponse, ridesResponse] =
      await Promise.all([
        api.get("/admin/dashboard"),
        api.get("/admin/users"),
        api.get("/admin/drivers"),
        api.get("/admin/rides"),
      ]);

    setDashboard(dashboardResponse.data.data);
    setUsers(usersResponse.data.data);
    setDrivers(driversResponse.data.data);
    setRides(ridesResponse.data.data);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!socket) return undefined;

    const refresh = () => loadData();
    socket.on("admin:ride-updated", refresh);

    return () => {
      socket.off("admin:ride-updated", refresh);
    };
  }, [socket]);

  return (
    <AdminDashboard
      dashboard={dashboard}
      users={users}
      drivers={drivers}
      rides={rides}
    />
  );
};
