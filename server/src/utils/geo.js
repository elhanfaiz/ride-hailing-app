const earthRadiusKm = 6371;

const toRadians = (degrees) => (degrees * Math.PI) / 180;

export const calculateDistanceKm = (origin, destination) => {
  const dLat = toRadians(destination.lat - origin.lat);
  const dLng = toRadians(destination.lng - origin.lng);
  const lat1 = toRadians(origin.lat);
  const lat2 = toRadians(destination.lat);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) *
      Math.sin(dLng / 2) *
      Math.cos(lat1) *
      Math.cos(lat2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
};

export const estimateDurationMinutes = (distanceKm, avgSpeedKmH = 28) =>
  Math.max(5, Math.round((distanceKm / avgSpeedKmH) * 60));

