export const DEFAULT_PICKUP = {
  address: "Shahrah-e-Faisal, Karachi",
  lat: 24.8607,
  lng: 67.0011,
};

export const DEFAULT_DROPOFF = {
  address: "Clifton Block 5, Karachi",
  lat: 24.8138,
  lng: 67.0295,
};

export const normalizeCoordinate = (value, fallback) => {
  if (value === "" || value === undefined || value === null) {
    return fallback;
  }

  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
};

export const normalizeRideForm = (form) => ({
  pickup: {
    address: form?.pickup?.address?.trim() || DEFAULT_PICKUP.address,
    lat: normalizeCoordinate(form?.pickup?.lat, DEFAULT_PICKUP.lat),
    lng: normalizeCoordinate(form?.pickup?.lng, DEFAULT_PICKUP.lng),
  },
  dropoff: {
    address: form?.dropoff?.address?.trim() || DEFAULT_DROPOFF.address,
    lat: normalizeCoordinate(form?.dropoff?.lat, DEFAULT_DROPOFF.lat),
    lng: normalizeCoordinate(form?.dropoff?.lng, DEFAULT_DROPOFF.lng),
  },
  paymentMethod: form?.paymentMethod || "cash",
});

