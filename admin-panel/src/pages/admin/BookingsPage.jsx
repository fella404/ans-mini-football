import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  RefreshCw,
  Search,
  TriangleAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ToolbarSelect from "@/components/ui/ToolbarSelect";
import EmptyState from "@/components/ui/EmptyState";
import StatusBadge from "@/components/ui/StatusBadge";
import { ALL_STATUS, STATUS_ITEMS, STATUS_VALUES } from "@/lib/status";
import { LIMIT_VALUES, parsePaging } from "@/lib/paging";
import BookingDetailDialog from "@/components/admin/BookingDetailDialog";
import ExportDialog from "@/components/admin/ExportDialog";
import { useBookingsStore } from "@/stores/useBookingsStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { cn } from "@/lib/utils";
import { formatJam, formatRupiah, formatTanggalPendek } from "@/lib/format";

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const LIMIT_ITEMS = LIMIT_VALUES.map((value) => ({
  value,
  label: String(value),
}));

// Maksimal 7 nomor + ellipsis supaya footer tidak penuh saat halaman banyak.
const pageItems = (page, total) => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (page <= 4) return [1, 2, 3, 4, 5, "…", total];
  if (page >= total - 3) {
    return [1, "…", total - 4, total - 3, total - 2, total - 1, total];
  }
  return [1, "…", page - 1, page, page + 1, "…", total];
};

const StatusSelect = ({ value, onChange }) => (
  <ToolbarSelect
    items={STATUS_ITEMS}
    value={value || ALL_STATUS}
    onChange={(next) => onChange(next === ALL_STATUS ? "" : next)}
    ariaLabel="Filter status"
    triggerClassName="w-full sm:w-40"
    popupClassName="w-44"
  />
);

const BookingsPage = () => {
  const [params, setParams] = useSearchParams();
  const role = useAuthStore((s) => s.user?.role);
  const rawStatus = params.get("status") ?? "";
  const rawDate = params.get("date") ?? "";
  const status = STATUS_VALUES.includes(rawStatus) ? rawStatus : "";
  const date = DATE_REGEX.test(rawDate) ? rawDate : "";
  const search = params.get("search") ?? "";
  const { page, limit } = parsePaging(params);

  const [searchInput, setSearchInput] = useState(search);
  const [selected, setSelected] = useState(null);
  const [exportOpen, setExportOpen] = useState(false);

  const rows = useBookingsStore((s) => s.rows);
  const loadState = useBookingsStore((s) => s.status);
  const busy = useBookingsStore((s) => s.busy);
  const error = useBookingsStore((s) => s.error);
  const meta = useBookingsStore((s) => s.meta);
  const load = useBookingsStore((s) => s.load);
  const refresh = useBookingsStore((s) => s.refresh);

  useEffect(() => {
    load({ status, date, search, page, limit });
  }, [load, status, date, search, page, limit]);

  const setParam = useCallback(
    (key, raw, { resetPage = false, push = false } = {}) => {
      // Default tidak ditulis supaya URL bersih.
      const value =
        (key === "page" && raw === "1") || (key === "limit" && raw === "10")
          ? ""
          : raw;
      const next = new URLSearchParams(params);
      if (value) next.set(key, value);
      else next.delete(key);
      if (resetPage) next.delete("page");
      if (next.toString() === params.toString()) return;
      setParams(next, { replace: !push });
    },
    [params, setParams],
  );

  // Sinkron dari URL luar (back/forward atau link); jangan timpa ketikan yang sama.
  // Pola resmi React "menyesuaikan state saat prop berubah" — dilakukan saat render.
  const [syncedSearch, setSyncedSearch] = useState(search);
  if (search !== syncedSearch) {
    setSyncedSearch(search);
    if (searchInput.trim() !== search) setSearchInput(search);
  }

  useEffect(() => {
    const timer = window.setTimeout(
      () => setParam("search", searchInput.trim(), { resetPage: true }),
      300,
    );
    return () => window.clearTimeout(timer);
  }, [searchInput, setParam]);

  // Halaman di luar rentang (mis. setelah cancel) dikoreksi lewat URL.
  useEffect(() => {
    if (meta.total_pages > 0 && meta.page > meta.total_pages) {
      setParam("page", String(meta.total_pages));
    }
  }, [meta.page, meta.total_pages, setParam]);

  const hasFilters = Boolean(status || date || search);
  const initialLoading =
    rows.length === 0 && (loadState === "idle" || loadState === "loading");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-lg font-bold uppercase tracking-[0.1em] text-foreground">
          Pesanan
        </h1>
        <div className="flex items-center gap-2">
          {role === "admin" && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setExportOpen(true)}
            >
              <Download aria-hidden="true" />
              Export
            </Button>
          )}
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
      </div>

      {error && rows.length > 0 && (
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

      <section className="border border-border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border p-3">
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <StatusSelect
              value={status}
              onChange={(value) =>
                setParam("status", value, { resetPage: true })
              }
            />

            <Input
              type="date"
              value={date}
              onChange={(event) =>
                setParam("date", event.target.value, { resetPage: true })
              }
              aria-label="Filter tanggal main"
              className="sm:w-40"
            />
          </div>

          <div className="relative w-full min-w-0 sm:max-w-sm sm:flex-1">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Cari nama, no HP, atau kode"
              aria-label="Cari pesanan"
              className="pl-8"
            />
          </div>
        </div>

        {initialLoading ? (
          <div role="status" aria-live="polite" className="space-y-2 p-4">
            {[0, 1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-9 animate-pulse bg-muted/40 motion-reduce:animate-none"
              />
            ))}
            <span className="sr-only">Memuat pesanan…</span>
          </div>
        ) : loadState === "error" && rows.length === 0 ? (
          <div role="alert" className="p-6">
            <div className="flex items-start gap-3">
              <TriangleAlert
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 text-destructive"
              />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Data pesanan gagal dimuat
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
        ) : rows.length === 0 ? (
          <EmptyState
            title={
              hasFilters ? "Tidak ada pesanan yang cocok" : "Belum ada pesanan"
            }
            hint={
              hasFilters
                ? "Ubah status, tanggal, atau kata kunci pencarian."
                : "Pesanan baru dari customer akan muncul di sini."
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[56rem] text-left text-xs">
              <caption className="sr-only">
                Daftar pesanan, klik baris untuk melihat detail
              </caption>
              <thead>
                <tr className="border-b border-border text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                  {[
                    "Pelanggan",
                    "No HP",
                    "Lapangan",
                    "Jadwal",
                    "Total",
                    "Status",
                  ].map((label) => (
                    <th
                      key={label}
                      scope="col"
                      className="px-4 py-2.5 font-medium"
                    >
                      {label}
                    </th>
                  ))}
                  <th
                    scope="col"
                    className="px-4 py-2.5 text-right font-medium"
                  >
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((row) => (
                  <tr
                    key={row.booking_code}
                    tabIndex={0}
                    onClick={() => setSelected(row)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelected(row);
                      }
                    }}
                    className="cursor-pointer align-middle transition-colors hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">
                            {row.customer_name}
                          </p>
                          <p className="mt-0.5 font-mono text-[10px] tracking-[0.06em] text-muted-foreground">
                            {row.booking_code}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground tabular-nums">
                      {row.customer_phone || "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {row.field_name}
                    </td>
                    <td className="px-4 py-3">
                      <p className="whitespace-nowrap text-foreground">
                        {formatTanggalPendek(row.play_date)}
                      </p>
                      <p className="mt-0.5 whitespace-nowrap text-[11px] text-muted-foreground tabular-nums">
                        {formatJam(row.start_time)} · {row.duration_hours} jam
                      </p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap tabular-nums">
                      <p className="font-medium text-foreground">
                        {formatRupiah(row.total_price)}
                      </p>
                      <p className="mt-0.5 text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                        {row.payment_type === "dp"
                          ? `DP ${row.dp_percentage ?? ""}%`
                          : "Full"}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        type="button"
                        variant="outline"
                        size="xs"
                        onClick={(event) => {
                          event.stopPropagation();
                          setSelected(row);
                        }}
                        aria-label={`Buka detail pesanan ${row.booking_code}`}
                      >
                        <Eye aria-hidden="true" />
                        Detail
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {rows.length > 0 && (
          <nav
            aria-label="Navigasi halaman pesanan"
            className="flex flex-wrap items-center justify-between gap-2 border-t border-border p-3 text-[11px] text-muted-foreground"
          >
            <div className="flex items-center gap-2">
              <span>Baris per halaman</span>
              <ToolbarSelect
                items={LIMIT_ITEMS}
                value={limit}
                onChange={(value) =>
                  setParam("limit", String(value), { resetPage: true })
                }
                ariaLabel="Baris per halaman"
                triggerClassName="h-7 w-16 px-2.5"
                popupClassName="w-20"
              />
            </div>

            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="icon-xs"
                onClick={() =>
                  setParam("page", String(meta.page - 1), { push: true })
                }
                disabled={busy || meta.page <= 1}
                aria-label="Halaman sebelumnya"
              >
                <ChevronLeft aria-hidden="true" />
              </Button>

              {pageItems(meta.page, meta.total_pages).map((item, index) =>
                item === "…" ? (
                  <span
                    key={`gap-${index}`}
                    aria-hidden="true"
                    className="px-1"
                  >
                    …
                  </span>
                ) : (
                  <Button
                    key={item}
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={() =>
                      setParam("page", String(item), { push: true })
                    }
                    disabled={busy}
                    aria-label={`Halaman ${item}`}
                    aria-current={item === meta.page ? "page" : undefined}
                    className={cn(
                      "min-w-6 px-1.5 tabular-nums",
                      item === meta.page &&
                        "bg-muted text-foreground hover:bg-muted",
                    )}
                  >
                    {item}
                  </Button>
                ),
              )}

              <Button
                type="button"
                variant="outline"
                size="icon-xs"
                onClick={() =>
                  setParam("page", String(meta.page + 1), { push: true })
                }
                disabled={busy || meta.page >= meta.total_pages}
                aria-label="Halaman berikutnya"
              >
                <ChevronRight aria-hidden="true" />
              </Button>
            </div>
          </nav>
        )}
      </section>

      {selected && (
        <BookingDetailDialog
          key={selected.booking_code}
          booking={selected}
          onClose={() => setSelected(null)}
          onChanged={refresh}
        />
      )}

      {exportOpen && <ExportDialog onClose={() => setExportOpen(false)} />}
    </div>
  );
};

export default BookingsPage;
