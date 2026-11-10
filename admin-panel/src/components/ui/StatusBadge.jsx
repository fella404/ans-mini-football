import { STATUS_LABELS } from "@/lib/status";

const TONES = {
  pending_payment: "bg-muted text-muted-foreground",
  waiting_approval: "bg-primary/15 text-primary",
  PAID: "bg-primary/10 text-primary",
  completed: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive/10 text-destructive",
};

const StatusBadge = ({ status }) => (
  <span
    className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium ${
      TONES[status] ?? "bg-muted text-muted-foreground"
    }`}
  >
    <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
    {STATUS_LABELS[status] ?? status}
  </span>
);

export default StatusBadge;
