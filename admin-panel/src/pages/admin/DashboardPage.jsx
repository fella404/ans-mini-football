import { useEffect } from "react";
import {
  CalendarDays,
  ClipboardCheck,
  Receipt,
  RefreshCw,
  TriangleAlert,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import StatCard from "@/components/ui/StatCard";
import DashboardChart from "@/components/admin/DashboardChart";
import TodaySchedule from "@/components/admin/TodaySchedule";
import ActionNeededTable from "@/components/admin/ActionNeededTable";
import { useDashboardStore } from "@/stores/useDashboardStore";
import { cn } from "@/lib/utils";
import { formatBulan, formatRupiah } from "@/lib/format";

const DashboardSkeleton = () => (
  <div className="space-y-4" role="status" aria-live="polite">
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {[0, 1, 2, 3].map((item) => (
        <div
          key={item}
          className="h-[7.5rem] animate-pulse border border-border bg-muted/40 motion-reduce:animate-none"
        />
      ))}
    </div>
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="h-80 animate-pulse border border-border bg-muted/40 motion-reduce:animate-none" />
      <div className="h-80 animate-pulse border border-border bg-muted/40 motion-reduce:animate-none" />
    </div>
    <div className="h-56 animate-pulse border border-border bg-muted/40 motion-reduce:animate-none" />
    <span className="sr-only">Memuat data dashboard…</span>
  </div>
);

const DashboardPage = () => {
  const data = useDashboardStore((s) => s.data);
  const month = useDashboardStore((s) => s.month);
  const status = useDashboardStore((s) => s.status);
  const busy = useDashboardStore((s) => s.busy);
  const error = useDashboardStore((s) => s.error);
  const load = useDashboardStore((s) => s.load);
  const refresh = useDashboardStore((s) => s.refresh);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const id = window.setInterval(() => {
      const state = useDashboardStore.getState();
      if (document.visibilityState === "visible" && !state.busy) {
        state.refresh();
      }
    }, 30000);

    return () => window.clearInterval(id);
  }, []);

  if (!data && (status === "idle" || status === "loading")) {
    return <DashboardSkeleton />;
  }

  if (!data) {
    return (
      <div
        role="alert"
        className="border border-destructive/40 bg-destructive/5 p-6"
      >
        <div className="flex items-start gap-3">
          <TriangleAlert
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0 text-destructive"
          />
          <div>
            <p className="text-sm font-semibold text-foreground">
              Data dashboard gagal dimuat
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {error}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={refresh}
              className="mt-4"
            >
              Coba lagi
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const { stats, daily, today_schedule, action_needed } = data;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-lg font-bold uppercase tracking-[0.1em] text-foreground">
            Ringkasan
          </h1>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={refresh}
          disabled={busy}
          aria-busy={busy}
        >
          <RefreshCw
            aria-hidden="true"
            className={cn(busy && "animate-spin motion-reduce:animate-none")}
          />
          Perbarui
        </Button>
      </div>

      {error && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-2 border border-destructive/40 bg-destructive/5 px-3 py-2 text-[11px] text-destructive"
        >
          <span className="flex items-center gap-1.5">
            <TriangleAlert aria-hidden="true" className="size-3.5 shrink-0" />
            {error}
          </span>
          <button
            type="button"
            onClick={refresh}
            className="font-semibold underline underline-offset-2"
          >
            Coba lagi
          </button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Menunggu Verifikasi"
          value={stats.waiting_approval}
          hint="Perlu ditinjau"
          to="/pesanan?status=waiting_approval"
          icon={ClipboardCheck}
          accent={stats.waiting_approval > 0}
        />
        <StatCard
          label="Pesanan Hari Ini"
          value={stats.bookings_today}
          hint="Termasuk yang belum lunas"
          icon={CalendarDays}
        />
        <StatCard
          label="Pendapatan Bulan Ini"
          value={formatRupiah(stats.revenue_this_month)}
          hint="Dari pesanan lunas & selesai"
          icon={Wallet}
        />
        <StatCard
          label="Pesanan Bulan Ini"
          value={stats.bookings_this_month}
          hint="Jumlah pesanan lunas & selesai"
          icon={Receipt}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <DashboardChart daily={daily} month={month} />
        <TodaySchedule rows={today_schedule} />
      </div>

      <ActionNeededTable rows={action_needed} onChanged={refresh} />
    </div>
  );
};

export default DashboardPage;
