export const Card = ({ children, className = "" }) => (
  <div className={`bg-white border border-slate-100 rounded-2xl p-6 shadow-sm ${className}`}>
    {children}
  </div>
);
