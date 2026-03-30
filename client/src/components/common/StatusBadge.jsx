const colorMap = {
  searching: "bg-amber-500/20 text-amber-200",
  driver_assigned: "bg-sky-500/20 text-sky-200",
  driver_arriving: "bg-cyan-500/20 text-cyan-200",
  in_progress: "bg-violet-500/20 text-violet-200",
  completed: "bg-lime-500/20 text-lime-200",
  cancelled: "bg-rose-500/20 text-rose-200",
  rejected: "bg-rose-500/20 text-rose-200",
};

export const StatusBadge = ({ status, ...props }) => (
  <span
    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${colorMap[status] || "bg-white/10 text-slate-200"}`}
    {...props}
  >
    {status?.replaceAll("_", " ")}
  </span>
);
