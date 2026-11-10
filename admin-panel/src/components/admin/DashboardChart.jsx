import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  formatBulan,
  formatRupiah,
  formatTanggalPendek,
} from "@/lib/format";

const METRICS = [
  { value: "bookings", label: "Pesanan" },
  { value: "revenue", label: "Pendapatan" },
];

const compactNumber = (value) => {
  const n = Number(value) || 0;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}jt`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}rb`;
  return String(n);
};

const ChartTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;

  return (
    <div className="border border-border bg-popover px-2.5 py-2 text-[11px] text-popover-foreground shadow-sm">
      <p className="font-semibold">{formatTanggalPendek(point.date)}</p>
      <p className="mt-1 flex justify-between gap-6">
        <span className="text-muted-foreground">Pesanan</span>
        <span className="tabular-nums">{point.bookings}</span>
      </p>
      <p className="flex justify-between gap-6">
        <span className="text-muted-foreground">Pendapatan</span>
        <span className="tabular-nums">{formatRupiah(point.revenue)}</span>
      </p>
    </div>
  );
};

const DashboardChart = ({ daily, month }) => {
  const [metric, setMetric] = useState("bookings");

  const points = daily.map((row) => ({
    ...row,
    day: String(Number(row.date.slice(8, 10))),
  }));

  const totalBookings = daily.reduce((sum, row) => sum + row.bookings, 0);
  const totalRevenue = daily.reduce((sum, row) => sum + row.revenue, 0);
  const tickInterval = Math.max(0, Math.ceil(points.length / 8) - 1);
  const isRevenue = metric === "revenue";

  return (
    <section
      aria-labelledby="chart-title"
      className="flex flex-col border border-border bg-card"
    >
      <header className="flex flex-wrap items-center justify-between border-b border-border p-4">
        <div>
          <h2
            id="chart-title"
            className="font-heading text-xs font-bold uppercase tracking-[0.14em] text-foreground"
          >
            Aktivitas Harian
          </h2>
        </div>

        <div
          role="group"
          aria-label="Pilih metrik grafik"
          className="flex border border-border"
        >
          {METRICS.map((item) => (
            <Button
              key={item.value}
              type="button"
              size="xs"
              variant={metric === item.value ? "default" : "secondary"}
              aria-pressed={metric === item.value}
              onClick={() => setMetric(item.value)}
              className="h-7 rounded-none border-0 px-2.5 text-[10px] font-semibold uppercase tracking-[0.1em]"
            >
              {item.label}
            </Button>
          ))}
        </div>
      </header>

      <div
        className="h-60 w-full p-4 pt-6"
        role="img"
        aria-label={`Grafik ${isRevenue ? "pendapatan" : "jumlah pesanan"} harian bulan ${formatBulan(month)}`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={points}
            accessibilityLayer
            margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
          >
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              interval={tickInterval}
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
            />
            <YAxis
              width={44}
              tickLine={false}
              axisLine={false}
              tickMargin={6}
              tickFormatter={isRevenue ? compactNumber : undefined}
              allowDecimals={false}
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
            />
            <Tooltip
              cursor={{ fill: "var(--muted)", opacity: 0.6 }}
              content={<ChartTooltip />}
            />
            <Bar
              dataKey={metric}
              fill={isRevenue ? "var(--chart-3)" : "var(--chart-2)"}
              radius={0}
              maxBarSize={26}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
};

export default DashboardChart;
