export const Button = ({
  children,
  className = "",
  variant = "primary",
  ...props
}) => {
  const styles = {
    primary:
      "bg-accent text-slate-950 hover:bg-lime-300 shadow-glow disabled:bg-lime-200/60",
    secondary:
      "bg-white/10 text-white hover:bg-white/15 disabled:bg-white/5",
    dark:
      "bg-black text-white hover:bg-slate-800 disabled:bg-slate-900",
    ghost:
      "border border-white/10 bg-transparent text-slate-200 hover:bg-white/5 disabled:border-white/5",
  };

  return (
    <button
      className={`inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold transition duration-200 disabled:cursor-not-allowed ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
