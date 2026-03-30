import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_DROPOFF,
  DEFAULT_PICKUP,
  normalizeCoordinate,
  normalizeRideForm,
} from "../src/utils/rideForm.js";

test("normalizeCoordinate returns fallback for empty values", () => {
  assert.equal(normalizeCoordinate("", 24.8607), 24.8607);
  assert.equal(normalizeCoordinate(undefined, 67.0011), 67.0011);
});

test("normalizeCoordinate coerces valid numeric input", () => {
  assert.equal(normalizeCoordinate("24.9123", 0), 24.9123);
  assert.equal(normalizeCoordinate(67.1234, 0), 67.1234);
});

test("normalizeRideForm fills pickup and dropoff defaults", () => {
  const result = normalizeRideForm({
    pickup: {
      address: "  ",
      lat: "",
      lng: "",
    },
    dropoff: {
      address: "",
      lat: null,
      lng: undefined,
    },
  });

  assert.deepEqual(result.pickup, DEFAULT_PICKUP);
  assert.deepEqual(result.dropoff, DEFAULT_DROPOFF);
  assert.equal(result.paymentMethod, "cash");
});

test("normalizeRideForm keeps explicit values and trims addresses", () => {
  const result = normalizeRideForm({
    pickup: {
      address: "  Test Pickup  ",
      lat: "24.9",
      lng: "67.2",
    },
    dropoff: {
      address: "  Test Dropoff ",
      lat: "24.8",
      lng: "67.0",
    },
    paymentMethod: "stripe",
  });

  assert.deepEqual(result, {
    pickup: {
      address: "Test Pickup",
      lat: 24.9,
      lng: 67.2,
    },
    dropoff: {
      address: "Test Dropoff",
      lat: 24.8,
      lng: 67.0,
    },
    paymentMethod: "stripe",
  });
});

