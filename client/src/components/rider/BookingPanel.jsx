import { useState } from "react";
import { motion } from "framer-motion";
import { Clock3, MapPinned, Navigation, Wallet } from "lucide-react";
import { Button } from "../common/Button";
import { Card } from "../common/Card";
import { Input } from "../common/Input";
import { Skeleton } from "../common/Skeleton";

const defaultLocation = {
  address: "",
  lat: 24.8607,
  lng: 67.0011,
};

const defaultDropoffLocation = {
  address: "",
  lat: 24.8138,
  lng: 67.0295,
};

export const BookingPanel = ({ onEstimate, onBook, estimate, loading }) => {
  const [form, setForm] = useState({
    pickup: defaultLocation,
    dropoff: defaultDropoffLocation,
    paymentMethod: "cash",
  });

  const handleLocationChange = (type, field, value) => {
    const normalizedValue =
      field === "address"
        ? value
        : value === "" || value === undefined || value === null
          ? ""
          : Number(value);

    setForm((previous) => ({
      ...previous,
      [type]: {
        ...previous[type],
        [field]: normalizedValue,
      },
    }));
  };

  return (
    <Card className="space-y-6 sm:space-y-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="pill">Book your ride</p>
          <h2 className="mt-4 font-display text-3xl font-bold text-white sm:text-4xl">
            Where are you headed today?
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400 sm:text-base">
            Enter pickup and destination details, preview the fare, and confirm your
            ride in a clean mobile-first flow.
          </p>
        </div>
        <div className="rounded-[1.6rem] border border-white/10 bg-white/5 px-4 py-3 text-right">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Service</p>
          <p className="mt-2 font-semibold text-white">RideFlow Go</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/60 p-4 sm:p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/15 text-accent">
              <Navigation size={18} />
            </div>
            <div>
              <p className="text-sm text-slate-400">Pickup</p>
              <p className="font-semibold text-white">Starting point</p>
            </div>
          </div>
          <div className="panel-grid">
            <Input
              label="Pickup address"
              placeholder="Airport Road"
              data-testid="pickup-address"
              value={form.pickup.address}
              onChange={(event) =>
                handleLocationChange("pickup", "address", event.target.value)
              }
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Latitude"
                type="number"
                step="any"
                data-testid="pickup-latitude"
                value={form.pickup.lat}
                onChange={(event) =>
                  handleLocationChange("pickup", "lat", event.target.value)
                }
              />
              <Input
                label="Longitude"
                type="number"
                step="any"
                data-testid="pickup-longitude"
                value={form.pickup.lng}
                onChange={(event) =>
                  handleLocationChange("pickup", "lng", event.target.value)
                }
              />
            </div>
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/60 p-4 sm:p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-500/15 text-sky-300">
              <MapPinned size={18} />
            </div>
            <div>
              <p className="text-sm text-slate-400">Destination</p>
              <p className="font-semibold text-white">Dropoff point</p>
            </div>
          </div>
          <div className="panel-grid">
            <Input
              label="Dropoff address"
              placeholder="Clifton Block 5"
              data-testid="dropoff-address"
              value={form.dropoff.address}
              onChange={(event) =>
                handleLocationChange("dropoff", "address", event.target.value)
              }
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Latitude"
                type="number"
                step="any"
                data-testid="dropoff-latitude"
                value={form.dropoff.lat}
                onChange={(event) =>
                  handleLocationChange("dropoff", "lat", event.target.value)
                }
              />
              <Input
                label="Longitude"
                type="number"
                step="any"
                data-testid="dropoff-longitude"
                value={form.dropoff.lng}
                onChange={(event) =>
                  handleLocationChange("dropoff", "lng", event.target.value)
                }
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr,auto]">
        <label className="flex flex-col gap-2 text-sm text-slate-300">
          <span className="font-medium">Payment method</span>
          <div className="flex items-center gap-3 rounded-[1.75rem] border border-white/10 bg-slate-950/60 px-4 py-3">
            <Wallet size={18} className="text-accent" />
            <select
              data-testid="payment-method"
              className="w-full bg-transparent text-white outline-none"
              value={form.paymentMethod}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  paymentMethod: event.target.value,
                }))
              }
            >
              <option value="cash" className="bg-slate-950">
                Cash
              </option>
              <option value="mock" className="bg-slate-950">
                Mock Card
              </option>
              <option value="stripe" className="bg-slate-950">
                Stripe
              </option>
            </select>
          </div>
        </label>

        <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[320px]">
          <Button onClick={() => onEstimate(form)} disabled={loading} data-testid="estimate-ride-button">
            <span data-testid="estimate-button-label">
              {loading ? "Estimating..." : "Estimate fare"}
            </span>
          </Button>
          <Button
            variant="secondary"
            onClick={() => onBook(form)}
            disabled={loading}
            data-testid="confirm-ride-button"
          >
            Confirm ride
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      ) : estimate ? (
        <motion.div
          data-testid="fare-estimate-card"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-4 rounded-[1.9rem] border border-accent/25 bg-gradient-to-br from-accent/10 via-white/5 to-sky-500/10 p-5 sm:grid-cols-3"
        >
          <div className="rounded-[1.4rem] bg-slate-950/55 p-4">
            <p className="text-sm text-slate-300">Estimated total</p>
            <p className="mt-2 text-3xl font-bold text-white">${estimate.total}</p>
          </div>
          <div className="rounded-[1.4rem] bg-slate-950/55 p-4">
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <MapPinned size={16} />
              Distance
            </div>
            <p className="mt-2 text-2xl font-semibold text-white">
              {estimate.distanceKm} km
            </p>
          </div>
          <div className="rounded-[1.4rem] bg-slate-950/55 p-4">
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <Clock3 size={16} />
              Estimated time
            </div>
            <p className="mt-2 text-2xl font-semibold text-white">
              {estimate.durationMinutes} mins
            </p>
          </div>
        </motion.div>
      ) : null}
    </Card>
  );
};
