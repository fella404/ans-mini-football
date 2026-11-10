import { Link } from "react-router-dom";
import { ArrowRight, CalendarDays } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import StatusBadge from "@/components/ui/StatusBadge";
import { formatJam } from "@/lib/format";

const TodaySchedule = ({ rows }) => (
  <section
    aria-labelledby="schedule-title"
    className="flex flex-col border border-border bg-card"
  >
    <header className="flex items-start justify-between gap-3 border-b border-border p-4">
      <div>
        <h2
          id="schedule-title"
          className="font-heading text-xs font-bold uppercase tracking-[0.14em] text-foreground"
        >
          Jadwal Hari Ini
        </h2>
        <p className="mt-1 text-[11px] text-muted-foreground">
          {rows.length} sesi terjadwal
        </p>
      </div>
      <CalendarDays
        aria-hidden="true"
        className="size-4 shrink-0 text-muted-foreground"
      />
    </header>

    {rows.length === 0 ? (
      <div className="flex flex-1 items-center">
        <div className="mx-auto">
          <EmptyState
            title="Belum ada jadwal hari ini"
            hint="Pesanan yang masuk hari ini akan tampil di sini."
          />
        </div>
      </div>
    ) : (
      <ul className="max-h-64 flex-1 divide-y divide-border overflow-y-auto">
        {rows.map((row) => (
          <li
            key={row.booking_code}
            className="flex items-start gap-3 px-4 py-3"
          >
            <span className="w-11 shrink-0 pt-0.5 font-heading text-sm font-bold leading-none text-foreground tabular-nums">
              {formatJam(row.start_time)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-foreground">
                {row.customer_name}
              </p>
              <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                {row.field_name} · {row.duration_hours} jam
              </p>
            </div>
            <StatusBadge status={row.status} />
          </li>
        ))}
      </ul>
    )}

    <footer className="mt-auto border-t border-border p-2">
      <Link
        to="/jadwal"
        className="flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        Lihat jadwal
        <ArrowRight aria-hidden="true" className="size-3" />
      </Link>
    </footer>
  </section>
);

export default TodaySchedule;
