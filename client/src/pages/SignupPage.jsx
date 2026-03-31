import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/common/Button";
import { Card } from "../components/common/Card";
import { Input } from "../components/common/Input";

const riderInitial = {
  fullName: "",
  email: "",
  password: "",
  phone: "",
};

const driverInitial = {
  fullName: "",
  email: "",
  password: "",
  phone: "",
  vehicleMake: "",
  vehicleModel: "",
  vehicleColor: "",
  plateNumber: "",
};

export const SignupPage = () => {
  const navigate = useNavigate();
  const { persistAuth } = useAuth();
  const [mode, setMode] = useState("user");
  const [riderForm, setRiderForm] = useState(riderInitial);
  const [driverForm, setDriverForm] = useState(driverInitial);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    try {
      if (mode === "driver") {
        const { data } = await api.post("/auth/drivers/register", {
          fullName: driverForm.fullName,
          email: driverForm.email,
          password: driverForm.password,
          phone: driverForm.phone,
          vehicle: {
            make: driverForm.vehicleMake,
            model: driverForm.vehicleModel,
            color: driverForm.vehicleColor,
            plateNumber: driverForm.plateNumber,
          },
        });

        persistAuth(data.data);
        navigate("/driver");
        return;
      }

      const { data } = await api.post("/auth/register", riderForm);
      persistAuth(data.data);
      navigate("/");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-mesh px-4 py-10">
      <Card className="w-full max-w-3xl">
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="pill">Create account</p>
              <h1 className="mt-3 font-display text-4xl font-bold text-white">
                Join the platform
              </h1>
            </div>
            <div className="grid grid-cols-2 rounded-2xl bg-white/5 p-1">
              <button
                type="button"
                className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  mode === "user"
                    ? "bg-white text-slate-950"
                    : "text-slate-300 hover:bg-white/5"
                }`}
                onClick={() => setMode("user")}
              >
                Rider
              </button>
              <button
                type="button"
                className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  mode === "driver"
                    ? "bg-white text-slate-950"
                    : "text-slate-300 hover:bg-white/5"
                }`}
                onClick={() => setMode("driver")}
              >
                Driver
              </button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Full name"
              value={mode === "user" ? riderForm.fullName : driverForm.fullName}
              onChange={(event) =>
                mode === "user"
                  ? setRiderForm((previous) => ({
                      ...previous,
                      fullName: event.target.value,
                    }))
                  : setDriverForm((previous) => ({
                      ...previous,
                      fullName: event.target.value,
                    }))
              }
            />
            <Input
              label="Phone"
              value={mode === "user" ? riderForm.phone : driverForm.phone}
              onChange={(event) =>
                mode === "user"
                  ? setRiderForm((previous) => ({
                      ...previous,
                      phone: event.target.value,
                    }))
                  : setDriverForm((previous) => ({
                      ...previous,
                      phone: event.target.value,
                    }))
              }
            />
            <Input
              label="Email"
              type="email"
              value={mode === "user" ? riderForm.email : driverForm.email}
              onChange={(event) =>
                mode === "user"
                  ? setRiderForm((previous) => ({
                      ...previous,
                      email: event.target.value,
                    }))
                  : setDriverForm((previous) => ({
                      ...previous,
                      email: event.target.value,
                    }))
              }
            />
            <Input
              label="Password"
              type="password"
              value={mode === "user" ? riderForm.password : driverForm.password}
              onChange={(event) =>
                mode === "user"
                  ? setRiderForm((previous) => ({
                      ...previous,
                      password: event.target.value,
                    }))
                  : setDriverForm((previous) => ({
                      ...previous,
                      password: event.target.value,
                    }))
              }
            />
            {mode === "driver" && (
              <>
                <Input
                  label="Vehicle make"
                  value={driverForm.vehicleMake}
                  onChange={(event) =>
                    setDriverForm((previous) => ({
                      ...previous,
                      vehicleMake: event.target.value,
                    }))
                  }
                />
                <Input
                  label="Vehicle model"
                  value={driverForm.vehicleModel}
                  onChange={(event) =>
                    setDriverForm((previous) => ({
                      ...previous,
                      vehicleModel: event.target.value,
                    }))
                  }
                />
                <Input
                  label="Vehicle color"
                  value={driverForm.vehicleColor}
                  onChange={(event) =>
                    setDriverForm((previous) => ({
                      ...previous,
                      vehicleColor: event.target.value,
                    }))
                  }
                />
                <Input
                  label="Plate number"
                  value={driverForm.plateNumber}
                  onChange={(event) =>
                    setDriverForm((previous) => ({
                      ...previous,
                      plateNumber: event.target.value,
                    }))
                  }
                />
              </>
            )}
          </div>

          {error && <p className="text-sm text-rose-300">{error}</p>}

          <Button type="submit" className="w-full">
            Create account
          </Button>

          <p className="text-sm text-slate-400">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-accent">
              Sign in
            </Link>
          </p>
        </form>
      </Card>
    </div>
  );
};
