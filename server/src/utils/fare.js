import { calculateDistanceKm, estimateDurationMinutes } from "./geo.js";

export const estimateFare = (pickup, dropoff) => {
  const distanceKm = calculateDistanceKm(pickup, dropoff);
  const durationMinutes = estimateDurationMinutes(distanceKm);
  const baseFare = Number(process.env.BASE_FARE || 2.5);
  const perKmRate = Number(process.env.PER_KM_RATE || 1.75);
  const perMinRate = Number(process.env.PER_MIN_RATE || 0.35);
  const surgeMultiplier = Number(process.env.SURGE_MULTIPLIER || 1);
  const subtotal =
    baseFare + distanceKm * perKmRate + durationMinutes * perMinRate;
  const total = Number((subtotal * surgeMultiplier).toFixed(2));

  return {
    baseFare,
    distanceKm: Number(distanceKm.toFixed(2)),
    durationMinutes,
    surgeMultiplier,
    total,
    currency: process.env.DEFAULT_CURRENCY || "usd",
  };
};
