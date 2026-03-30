export const Card = ({ children, className = "" }) => (
  <div className={`glass-card p-5 sm:p-6 ${className}`}>{children}</div>
);
