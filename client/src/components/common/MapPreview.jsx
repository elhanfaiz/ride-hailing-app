export const MapPreview = ({ pickup, dropoff, liveLocation }) => {
  const token = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
  const center = liveLocation || pickup || { lat: 24.8607, lng: 67.0011 };

  if (token && center?.lat && center?.lng) {
    const markers = [
      pickup ? `pin-s-a+84cc16(${pickup.lng},${pickup.lat})` : null,
      dropoff ? `pin-s-b+0ea5e9(${dropoff.lng},${dropoff.lat})` : null,
      liveLocation ? `pin-s-car+111827(${liveLocation.lng},${liveLocation.lat})` : null,
    ]
      .filter(Boolean)
      .join(",");

    const mapUrl = `https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/${markers}/${center.lng},${center.lat},12/900x420?access_token=${token}`;

    return (
      <img
        src={mapUrl}
        alt="Trip map preview"
        className="h-72 w-full rounded-3xl object-cover"
      />
    );
  }

  return (
    <div className="flex h-72 w-full items-end rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_top,rgba(190,242,100,0.12),transparent_20%),linear-gradient(135deg,#111827,#020617)] p-6">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-slate-400">
          Map preview fallback
        </p>
        <p className="mt-3 max-w-md text-sm text-slate-300">
          Add `VITE_MAPBOX_ACCESS_TOKEN` to render a live static map for pickup,
          dropoff, and driver coordinates.
        </p>
      </div>
    </div>
  );
};

