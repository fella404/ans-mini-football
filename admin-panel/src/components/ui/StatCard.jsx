import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const StatCard = ({ label, value, hint, to, icon: Icon, accent = false }) => {
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[10px] font-semibold uppercase leading-snug tracking-[0.14em] text-muted-foreground">
          {label}
        </p>
        {Icon && (
          <Icon
            aria-hidden="true"
            className="size-4 shrink-0 text-muted-foreground"
          />
        )}
      </div>
      <p className="mt-3 truncate font-heading text-[1.65rem] font-bold leading-none tracking-tight text-foreground tabular-nums sm:text-3xl">
        {value}
      </p>
      {hint && (
        <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
          {hint}
        </p>
      )}
    </>
  );

  const className = cn(
    "block border border-border bg-card p-4 transition-colors duration-150",
    accent && "border-l-2 border-l-chart-2",
  );

  if (!to) return <div className={className}>{content}</div>;

  return (
    <Link
      to={to}
      className={cn(className, "hover:border-foreground/20 hover:bg-muted/40")}
    >
      {content}
    </Link>
  );
};

export default StatCard;
