import test from "node:test";
import assert from "node:assert/strict";
import { calculateDistanceKm, estimateDurationMinutes } from "../src/utils/geo.js";
import { estimateFare } from "../src/utils/fare.js";

test("calculateDistanceKm returns zero for same point", () => {
  const point = { lat: 24.8607, lng: 67.0011 };
  assert.equal(calculateDistanceKm(point, point), 0);
});

test("estimateDurationMinutes enforces minimum trip duration", () => {
  assert.equal(estimateDurationMinutes(0.2), 5);
});

test("estimateFare returns stable structure for configured rates", () => {
  process.env.BASE_FARE = "2.5";
  process.env.PER_KM_RATE = "2";
  process.env.PER_MIN_RATE = "0.5";
  process.env.SURGE_MULTIPLIER = "1.2";
  process.env.DEFAULT_CURRENCY = "usd";

  const fare = estimateFare(
    { lat: 24.8607, lng: 67.0011 },
    { lat: 24.8733, lng: 67.0333 }
  );

  assert.equal(fare.baseFare, 2.5);
  assert.equal(fare.currency, "usd");
  assert.ok(fare.distanceKm > 0);
  assert.ok(fare.durationMinutes >= 5);
  assert.ok(fare.total > fare.baseFare);
});

