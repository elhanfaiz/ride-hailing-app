import { Link, NavLink, useNavigate } from "react-router-dom";
import { CarFront, LayoutDashboard, LogOut, MapPinned, Shield } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const navConfig = {
  user: [
    { to: "/", label: "Book", icon: MapPinned },
    { to: "/history", label: "History", icon: CarFront },
  ],
  driver: [{ to: "/driver", label: "Driver", icon: CarFront }],
  admin: [{ to: "/admin", label: "Admin", icon: Shield }],
};

export const AppShell = ({ children }) => {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();

  const links = navConfig[auth.role] || [];

  return (
    <div className="min-h-screen bg-mesh">
      <header className="border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <Link to="/" className="flex items-center gap-3 text-white">
            <div className="rounded-2xl bg-accent p-2 text-slate-950">
              <LayoutDashboard size={18} />
            </div>
            <div>
              <div className="font-display text-lg font-bold">RideFlow</div>
              <div className="text-xs uppercase tracking-[0.3em] text-slate-400">
                Uber Clone
              </div>
            </div>
          </Link>

          <div className="hidden items-center gap-2 md:flex">
            {links.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `rounded-2xl px-4 py-2 text-sm transition ${
                    isActive ? "bg-white text-slate-950" : "text-slate-300 hover:bg-white/10"
                  }`
                }
              >
                <span className="inline-flex items-center gap-2">
                  <Icon size={16} />
                  {label}
                </span>
              </NavLink>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-white">{auth.account?.fullName}</p>
              <p className="text-xs capitalize text-slate-400">{auth.role}</p>
            </div>
            <button
              className="rounded-2xl bg-white/10 p-3 text-white transition hover:bg-white/15"
              onClick={() => {
                logout();
                navigate("/login");
              }}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
};

