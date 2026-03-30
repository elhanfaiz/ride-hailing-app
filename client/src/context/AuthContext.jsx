import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(() => {
    const token = localStorage.getItem("uber-clone-token");
    const role = localStorage.getItem("uber-clone-role");
    const account = localStorage.getItem("uber-clone-account");

    return {
      token,
      role,
      account: account ? JSON.parse(account) : null,
      loading: false,
    };
  });

  const persistAuth = (data) => {
    localStorage.setItem("uber-clone-token", data.token);
    localStorage.setItem("uber-clone-role", data.role);
    localStorage.setItem("uber-clone-account", JSON.stringify(data.account));
    setAuth({
      token: data.token,
      role: data.role,
      account: data.account,
      loading: false,
    });
  };

  const logout = () => {
    localStorage.removeItem("uber-clone-token");
    localStorage.removeItem("uber-clone-role");
    localStorage.removeItem("uber-clone-account");
    setAuth({ token: null, role: null, account: null, loading: false });
  };

  const refreshProfile = async () => {
    if (!auth.token) return;

    try {
      const { data } = await api.get("/auth/me");
      setAuth((previous) => ({
        ...previous,
        account: data.data.profile,
        role: data.data.role,
      }));
      localStorage.setItem("uber-clone-account", JSON.stringify(data.data.profile));
      localStorage.setItem("uber-clone-role", data.data.role);
    } catch (_error) {
      logout();
    }
  };

  useEffect(() => {
    refreshProfile();
  }, []);

  return (
    <AuthContext.Provider value={{ auth, persistAuth, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

