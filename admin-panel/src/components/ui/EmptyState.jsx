const EmptyState = ({ title, hint }) => (
  <div className="px-5 py-10 text-center">
    <p className="text-[13px] font-semibold text-foreground">{title}</p>
    {hint && (
      <p className="mt-1 text-xs leading-snug text-muted-foreground">{hint}</p>
    )}
  </div>
);

export default EmptyState;
