import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { AppShell } from "./layouts/AppShell";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import { DriverPage } from "./pages/DriverPage";
import { AdminPage } from "./pages/AdminPage";
import { RideHistoryPage } from "./pages/RideHistoryPage";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { auth } = useAuth();

  if (!auth.token) return <Navigate to="/login" replace />;
  if (allowedRoles?.length && !allowedRoles.includes(auth.role)) {
    if (auth.role === "driver") return <Navigate to="/driver" replace />;
    if (auth.role === "admin") return <Navigate to="/admin" replace />;
    return <Navigate to="/" replace />;
  }

  return <AppShell>{children}</AppShell>;
};

export default function App() {
  const { auth } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={auth.token ? <Navigate to={auth.role === "driver" ? "/driver" : auth.role === "admin" ? "/admin" : "/"} replace /> : <LoginPage />}
      />
      <Route
        path="/signup"
        element={auth.token ? <Navigate to="/" replace /> : <SignupPage />}
      />
      <Route
        path="/"
        element={
          <ProtectedRoute allowedRoles={["user"]}>
            <HomePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/history"
        element={
          <ProtectedRoute allowedRoles={["user"]}>
            <RideHistoryPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/driver"
        element={
          <ProtectedRoute allowedRoles={["driver"]}>
            <DriverPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to={auth.token ? "/" : "/login"} replace />} />
    </Routes>
  );
}
