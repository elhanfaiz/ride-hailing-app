import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, ShieldCheck, TimerReset, WalletCards } from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/common/Button";
import { Card } from "../components/common/Card";
import { Input } from "../components/common/Input";

const highlights = [
  {
    title: "Live dispatch",
    description: "Socket-powered ride status, nearby driver discovery, and active trip tracking.",
    icon: TimerReset,
  },
  {
    title: "Secure access",
    description: "JWT sessions for riders, drivers, and admins with protected dashboards.",
    icon: ShieldCheck,
  },
  {
    title: "Payments ready",
    description: "Mock checkout today, Stripe-ready flows when you want to go live.",
    icon: WalletCards,
  },
];

export const LoginPage = () => {
  const navigate = useNavigate();
  const { persistAuth } = useAuth();
  const [mode, setMode] = useState("user");
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const endpoint =
        mode === "driver" ? "/auth/drivers/login" : "/auth/users/login";
      const { data } = await api.post(endpoint, form);
      persistAuth(data.data);

      if (data.data.role === "driver") navigate("/driver");
      else if (data.data.role === "admin") navigate("/admin");
      else navigate("/");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-mesh px-4 py-8 sm:px-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.12),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(190,242,100,0.12),transparent_26%)]" />
      <div className="relative grid w-full max-w-6xl gap-6 lg:grid-cols-[1.12fr,0.88fr]">
        <motion.section
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card overflow-hidden p-0"
        >
          <div className="flex h-full flex-col justify-between bg-[linear-gradient(145deg,#020617_0%,#020617_55%,#0f172a_100%)] p-6 sm:p-8 lg:p-10">
            <div>
              <p className="pill">RideFlow Platform</p>
              <h1 className="mt-5 max-w-xl font-display text-4xl font-bold leading-tight text-white sm:text-5xl">
                Book, dispatch, and track rides in a polished Uber-style flow.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-slate-300">
                Built for a real product feel: modern rider booking, driver operations,
                live maps, and admin visibility in one clean workspace.
              </p>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {highlights.map(({ title, description, icon: Icon }) => (
                <div
                  key={title}
                  className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-accent">
                    <Icon size={18} />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-white">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
                <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Rider demo</p>
                <p className="mt-3 text-base font-semibold text-white">rider@uberclone.dev</p>
                <p className="text-sm text-slate-300">password123</p>
              </div>
              <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
                <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Driver demo</p>
                <p className="mt-3 text-base font-semibold text-white">driver1@uberclone.dev</p>
                <p className="text-sm text-slate-300">password123</p>
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 34 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
        >
          <Card className="h-full border-white/12 bg-slate-950/70 p-6 sm:p-8">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-slate-400">
                  Welcome back
                </p>
                <h2 className="mt-3 font-display text-3xl font-bold text-white">
                  Sign in to continue
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Choose your role and jump straight into the rider or driver flow.
                </p>
              </div>

              <div className="grid grid-cols-2 rounded-[1.35rem] bg-white/5 p-1">
                <button
                  type="button"
                  data-testid="login-role-user"
                  className={`rounded-[1.15rem] px-4 py-3 text-sm font-semibold transition ${
                    mode === "user"
                      ? "bg-white text-slate-950 shadow-md"
                      : "text-slate-300 hover:bg-white/5"
                  }`}
                  onClick={() => setMode("user")}
                >
                  Rider / Admin
                </button>
                <button
                  type="button"
                  data-testid="login-role-driver"
                  className={`rounded-[1.15rem] px-4 py-3 text-sm font-semibold transition ${
                    mode === "driver"
                      ? "bg-white text-slate-950 shadow-md"
                      : "text-slate-300 hover:bg-white/5"
                  }`}
                  onClick={() => setMode("driver")}
                >
                  Driver
                </button>
              </div>

              <div className="panel-grid">
                <Input
                  label="Email address"
                  type="email"
                  placeholder="name@example.com"
                  data-testid="login-email"
                  value={form.email}
                  onChange={(event) =>
                    setForm((previous) => ({ ...previous, email: event.target.value }))
                  }
                />
                <Input
                  label="Password"
                  type="password"
                  placeholder="Enter your password"
                  data-testid="login-password"
                  value={form.password}
                  onChange={(event) =>
                    setForm((previous) => ({ ...previous, password: event.target.value }))
                  }
                />
              </div>

              {error && (
                <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={submitting} data-testid="login-submit">
                <span data-testid="login-submit-label" className="mr-2">
                  {submitting ? "Signing in..." : "Sign in"}
                </span>
                <ArrowRight size={16} />
              </Button>

              <div className="rounded-[1.4rem] border border-white/10 bg-white/5 p-4 text-sm text-slate-400">
                New to the platform?{" "}
                <Link to="/signup" className="font-semibold text-accent">
                  Create an account
                </Link>
              </div>
            </form>
          </Card>
        </motion.section>
      </div>
    </div>
  );
};
