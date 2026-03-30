export const Input = ({ label, ...props }) => (
  <label className="flex flex-col gap-2 text-sm text-slate-300">
    <span className="font-medium">{label}</span>
    <input
      className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3.5 text-white outline-none ring-0 transition placeholder:text-slate-500 focus:border-accent focus:bg-slate-950"
      {...props}
    />
  </label>
);
