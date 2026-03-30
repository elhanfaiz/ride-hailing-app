import { useEffect, useMemo, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const DEFAULT_CENTER = [67.0011, 24.8607];
const DRIVER_REROUTE_DISTANCE_METERS = 80;

const createLineFeature = (coordinates = []) => ({
  type: "Feature",
  geometry: {
    type: "LineString",
    coordinates,
  },
  properties: {},
});

const isValidPoint = (point) =>
  point &&
  Number.isFinite(Number(point.lat)) &&
  Number.isFinite(Number(point.lng));

const toLngLat = (point) => [Number(point.lng), Number(point.lat)];

const calculateDistanceMeters = (origin, destination) => {
  if (!isValidPoint(origin) || !isValidPoint(destination)) return 0;

  const toRadians = (degrees) => (degrees * Math.PI) / 180;
  const earthRadius = 6371000;
  const dLat = toRadians(destination.lat - origin.lat);
  const dLng = toRadians(destination.lng - origin.lng);
  const lat1 = toRadians(origin.lat);
  const lat2 = toRadians(destination.lat);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const calculateBearing = (from, to) => {
  if (!isValidPoint(from) || !isValidPoint(to)) return 0;

  const toRadians = (degrees) => (degrees * Math.PI) / 180;
  const toDegrees = (radians) => (radians * 180) / Math.PI;
  const lngDiff = toRadians(to.lng - from.lng);
  const lat1 = toRadians(from.lat);
  const lat2 = toRadians(to.lat);

  const y = Math.sin(lngDiff) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(lngDiff);

  return (toDegrees(Math.atan2(y, x)) + 360) % 360;
};

const fitPoints = (map, points) => {
  const validPoints = points.filter(isValidPoint);

  if (!validPoints.length) {
    map.flyTo({ center: DEFAULT_CENTER, zoom: 11, essential: true });
    return;
  }

  if (validPoints.length === 1) {
    map.flyTo({
      center: toLngLat(validPoints[0]),
      zoom: 13,
      essential: true,
    });
    return;
  }

  const bounds = new mapboxgl.LngLatBounds();
  validPoints.forEach((point) => bounds.extend(toLngLat(point)));
  map.fitBounds(bounds, { padding: 60, duration: 900, essential: true });
};

const animateMarkerPosition = ({ marker, markerElement, from, to, map }) => {
  if (!marker || !to || !map) return;

  const start = from || to;
  const duration = 1800;
  const startTime = performance.now();
  const bearing = calculateBearing(start, to);

  const easeOutCubic = (value) => 1 - (1 - value) ** 3;

  const step = (timestamp) => {
    const progress = Math.min((timestamp - startTime) / duration, 1);
    const eased = easeOutCubic(progress);
    const lng = start.lng + (to.lng - start.lng) * eased;
    const lat = start.lat + (to.lat - start.lat) * eased;

    marker.setLngLat([lng, lat]);

    if (markerElement) {
      markerElement.style.transform = `rotate(${bearing}deg)`;
    }

    if (progress < 1) {
      map.__driverAnimationFrame = requestAnimationFrame(step);
    }
  };

  if (map.__driverAnimationFrame) {
    cancelAnimationFrame(map.__driverAnimationFrame);
  }

  map.__driverAnimationFrame = requestAnimationFrame(step);
};

const createSourceIfMissing = (map, id) => {
  if (!map.getSource(id)) {
    map.addSource(id, {
      type: "geojson",
      data: createLineFeature(),
    });
  }
};

const setLineData = (map, id, coordinates = []) => {
  const source = map.getSource(id);
  if (source) {
    source.setData(createLineFeature(coordinates));
  }
};

const buildDirectionsUrl = (coordinates, token) =>
  `https://api.mapbox.com/directions/v5/mapbox/driving/${coordinates}?geometries=geojson&overview=full&steps=false&annotations=duration,distance&access_token=${token}`;

export const LiveMap = ({
  pickup,
  dropoff,
  driverLocation,
  nearbyDrivers = [],
  status,
  onEtaUpdate,
  className = "",
  testId = "live-map",
}) => {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const pickupMarkerRef = useRef(null);
  const dropoffMarkerRef = useRef(null);
  const driverMarkerRef = useRef(null);
  const nearbyMarkersRef = useRef([]);
  const driverMarkerElementRef = useRef(null);
  const lastDriverLocationRef = useRef(null);
  const lastReroutedFromRef = useRef(null);
  const fitHash = useMemo(
    () =>
      JSON.stringify([
        pickup?.lat,
        pickup?.lng,
        dropoff?.lat,
        dropoff?.lng,
        driverLocation?.lat,
        driverLocation?.lng,
        status,
      ]),
    [
      pickup?.lat,
      pickup?.lng,
      dropoff?.lat,
      dropoff?.lng,
      driverLocation?.lat,
      driverLocation?.lng,
      status,
    ]
  );

  useEffect(() => {
    const token = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
    if (!containerRef.current || !token) return undefined;

    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: DEFAULT_CENTER,
      zoom: 11,
      pitch: 40,
      bearing: -14,
      attributionControl: false,
    });

    map.addControl(new mapboxgl.NavigationControl(), "top-right");
    mapRef.current = map;

    map.on("load", () => {
      createSourceIfMissing(map, "trip-route");
      createSourceIfMissing(map, "driver-route");

      map.addLayer({
        id: "trip-route-line",
        type: "line",
        source: "trip-route",
        paint: {
          "line-color": "#38bdf8",
          "line-width": 4,
          "line-opacity": 0.45,
        },
      });

      map.addLayer({
        id: "driver-route-line",
        type: "line",
        source: "driver-route",
        paint: {
          "line-color": "#bef264",
          "line-width": 6,
          "line-opacity": 0.92,
        },
      });
    });

    return () => {
      nearbyMarkersRef.current.forEach((marker) => marker.remove());
      if (map.__driverAnimationFrame) {
        cancelAnimationFrame(map.__driverAnimationFrame);
      }
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const token = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
    if (!map || !token || !pickup || !dropoff) return;

    const controller = new AbortController();

    const loadTripRoute = async () => {
      try {
        const coordinates = `${pickup.lng},${pickup.lat};${dropoff.lng},${dropoff.lat}`;
        const response = await fetch(buildDirectionsUrl(coordinates, token), {
          signal: controller.signal,
        });
        const data = await response.json();
        const geometry = data.routes?.[0]?.geometry;

        if (geometry) {
          setLineData(map, "trip-route", geometry.coordinates);
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("[LiveMap] failed to load trip route", error);
        }
      }
    };

    if (map.isStyleLoaded()) {
      loadTripRoute();
    } else {
      map.once("load", loadTripRoute);
    }

    return () => {
      controller.abort();
      map.off("load", loadTripRoute);
    };
  }, [pickup?.lat, pickup?.lng, dropoff?.lat, dropoff?.lng]);

  useEffect(() => {
    const map = mapRef.current;
    const token = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
    if (!map || !token || !driverLocation || (!pickup && !dropoff)) return;

    const target =
      status === "in_progress" && dropoff
        ? dropoff
        : pickup || dropoff;

    if (!target) return;

    const distanceFromLastRoute = calculateDistanceMeters(
      lastReroutedFromRef.current,
      driverLocation
    );

    if (
      lastReroutedFromRef.current &&
      distanceFromLastRoute < DRIVER_REROUTE_DISTANCE_METERS
    ) {
      return;
    }

    const controller = new AbortController();

    const loadDriverRoute = async () => {
      try {
        const coordinates = `${driverLocation.lng},${driverLocation.lat};${target.lng},${target.lat}`;
        const response = await fetch(buildDirectionsUrl(coordinates, token), {
          signal: controller.signal,
        });
        const data = await response.json();
        const route = data.routes?.[0];

        if (!route?.geometry) return;

        setLineData(map, "driver-route", route.geometry.coordinates);
        lastReroutedFromRef.current = driverLocation;

        if (onEtaUpdate) {
          onEtaUpdate({
            etaMinutes: Math.max(1, Math.round(route.duration / 60)),
            distanceKm: Number((route.distance / 1000).toFixed(1)),
          });
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("[LiveMap] failed to load driver route", error);
        }
      }
    };

    if (map.isStyleLoaded()) {
      loadDriverRoute();
    } else {
      map.once("load", loadDriverRoute);
    }

    return () => {
      controller.abort();
      map.off("load", loadDriverRoute);
    };
  }, [
    driverLocation?.lat,
    driverLocation?.lng,
    pickup?.lat,
    pickup?.lng,
    dropoff?.lat,
    dropoff?.lng,
    status,
    onEtaUpdate,
  ]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !pickup) return;

    if (!pickupMarkerRef.current) {
      pickupMarkerRef.current = new mapboxgl.Marker({ color: "#bef264" })
        .setLngLat(toLngLat(pickup))
        .addTo(map);
    } else {
      pickupMarkerRef.current.setLngLat(toLngLat(pickup));
    }
  }, [pickup?.lat, pickup?.lng]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !dropoff) return;

    if (!dropoffMarkerRef.current) {
      dropoffMarkerRef.current = new mapboxgl.Marker({ color: "#38bdf8" })
        .setLngLat(toLngLat(dropoff))
        .addTo(map);
    } else {
      dropoffMarkerRef.current.setLngLat(toLngLat(dropoff));
    }
  }, [dropoff?.lat, dropoff?.lng]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !driverLocation) return;

    if (!driverMarkerRef.current) {
      const markerElement = document.createElement("div");
      markerElement.className =
        "driver-marker flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-slate-950/95 text-lg shadow-2xl";
      markerElement.setAttribute("data-testid", `${testId}-driver-marker`);
      markerElement.innerHTML =
        '<div class="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-[18px] text-slate-950">C</div>';

      driverMarkerElementRef.current = markerElement;
      driverMarkerRef.current = new mapboxgl.Marker({ element: markerElement })
        .setLngLat(toLngLat(driverLocation))
        .addTo(map);
      lastDriverLocationRef.current = driverLocation;
      return;
    }

    animateMarkerPosition({
      marker: driverMarkerRef.current,
      markerElement: driverMarkerElementRef.current,
      from: lastDriverLocationRef.current,
      to: driverLocation,
      map,
    });
    lastDriverLocationRef.current = driverLocation;
  }, [driverLocation?.lat, driverLocation?.lng]);

  useEffect(() => {
    const map = mapRef.current;
    nearbyMarkersRef.current.forEach((marker) => marker.remove());
    nearbyMarkersRef.current = [];

    if (!map || pickup || dropoff) return;

    nearbyMarkersRef.current = nearbyDrivers
      .filter((driver) => driver?.currentLocation)
      .map((driver) =>
        new mapboxgl.Marker({ color: "#f59e0b" })
          .setLngLat([
            driver.currentLocation.lng,
            driver.currentLocation.lat,
          ])
          .setPopup(
            new mapboxgl.Popup({ offset: 18 }).setHTML(
              `<div style="color:#111827"><strong>${driver.fullName}</strong><br/>${driver.vehicle?.make || ""} ${driver.vehicle?.model || ""}</div>`
            )
          )
          .addTo(map)
      );
  }, [nearbyDrivers, pickup, dropoff]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    fitPoints(map, [pickup, dropoff, driverLocation]);
  }, [fitHash, pickup, dropoff, driverLocation]);

  if (!import.meta.env.VITE_MAPBOX_ACCESS_TOKEN) {
    return (
      <div
        data-testid={testId}
        className={`flex h-[420px] items-end rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(190,242,100,0.12),transparent_20%),linear-gradient(135deg,#111827,#020617)] p-6 ${className}`}
      >
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">
            Mapbox token required
          </p>
          <p className="mt-3 max-w-md text-sm text-slate-300">
            Add `VITE_MAPBOX_ACCESS_TOKEN` to enable live map rendering and route
            snapping with accurate ETA updates.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid={testId}
      className={`relative overflow-hidden rounded-[2rem] border border-white/10 ${className}`}
    >
      <div ref={containerRef} className="h-[420px] w-full" />
    </div>
  );
};
