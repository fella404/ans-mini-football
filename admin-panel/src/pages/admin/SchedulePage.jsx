import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { RefreshCw, SlidersHorizontal, TriangleAlert } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import BookingDetailDialog from "@/components/admin/BookingDetailDialog";
import ScheduleGrid from "@/components/admin/ScheduleGrid";
import TimeSlotManager from "@/components/admin/TimeSlotManager";
import WalkInDialog from "@/components/admin/WalkInDialog";
import { useAuthStore } from "@/stores/useAuthStore";
import { useScheduleStore } from "@/stores/useScheduleStore";
import { cn } from "@/lib/utils";
import { wibToday } from "@/lib/format";

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const ScheduleSkeleton = () => (
  <div role="status" aria-live="polite" className="space-y-2 p-4">
    {[0, 1, 2, 3, 4].map((item) => (
      <div
        key={item}
        className="h-9 animate-pulse bg-muted/40 motion-reduce:animate-none"
      />
    ))}
    <span className="sr-only">Memuat jadwal…</span>
  </div>
);

const SchedulePage = () => {
  const [params, setParams] = useSearchParams();
  const rawDate = params.get("date") ?? "";
  const date = DATE_REGEX.test(rawDate) ? rawDate : wibToday();

  const role = useAuthStore((s) => s.user?.role);
  const isAdmin = role === "admin";

  const data = useScheduleStore((s) => s.data);
  const status = useScheduleStore((s) => s.status);
  const busy = useScheduleStore((s) => s.busy);
  const error = useScheduleStore((s) => s.error);
  const load = useScheduleStore((s) => s.load);
  const refresh = useScheduleStore((s) => s.refresh);

  const [walkInCell, setWalkInCell] = useState(null); // { field, slot, slotIndex }
  const [selected, setSelected] = useState(null); // booking detail
  const [manageOpen, setManageOpen] = useState(false);

  useEffect(() => {
    load(date);
  }, [load, date]);

  const setDate = useCallback(
    (next) => {
      const nextParams = new URLSearchParams(params);
      // Tanggal hari ini tidak ditulis supaya URL bersih.
      if (next && next !== wibToday()) nextParams.set("date", next);
      else nextParams.delete("date");
      if (nextParams.toString() === params.toString()) return;
      setParams(nextParams, { replace: true });
    },
    [params, setParams],
  );

  const openBooking = async (code) => {
    if (selected) return; // detail sedang dimuat / terbuka, jangan spam request
    // Modal instan dengan skeleton; data asli menyusul saat fetch selesai.
    setSelected({ booking_code: code, loading: true });
    try {
      const { data: res } = await api.get(`/bookings/${code}`);
      // Modal bisa ditutup saat fetch berjalan; jangan buka ulang data basi.
      setSelected((current) =>
        current?.booking_code === code ? res.data : current,
      );
    } catch (err) {
      setSelected((current) =>
        current?.booking_code === code ? null : current,
      );
      toast.error(
        err.response?.data?.message ?? "Gagal memuat detail pesanan.",
      );
    }
  };

  const occupiedSlotIds = (fieldId) =>
    new Set(
      (data?.occupancy ?? [])
        .filter((row) => row.field_id === fieldId)
        .map((row) => row.time_slot_id),
    );

  const initialLoading = !data && (status === "idle" || status === "loading");
  const hasData = Boolean(data);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-lg font-bold uppercase tracking-[0.1em] text-foreground">
          Jadwal
        </h1>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setManageOpen(true)}
            >
              <SlidersHorizontal aria-hidden="true" />
              Kelola Jadwal
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

      {error && hasData && (
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
          <div className="flex flex-wrap items-center gap-2">
            <Input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              aria-label="Pilih tanggal jadwal"
              className="w-40"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => setDate(wibToday())}
            >
              Hari ini
            </Button>
          </div>
        </div>

        {initialLoading ? (
          <ScheduleSkeleton />
        ) : status === "error" && !data ? (
          <div role="alert" className="p-6">
            <div className="flex items-start gap-3">
              <TriangleAlert
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 text-destructive"
              />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Jadwal gagal dimuat
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
        ) : (
          <ScheduleGrid
            date={date}
            fields={data.fields}
            slots={data.slots}
            occupancy={data.occupancy}
            onWalkIn={(field, slot, slotIndex) =>
              setWalkInCell({ field, slot, slotIndex })
            }
            onOpenBooking={openBooking}
          />
        )}
      </section>

      {walkInCell && data && (
        <WalkInDialog
          key={`${walkInCell.field.id}:${walkInCell.slot.id}`}
          date={date}
          field={walkInCell.field}
          slot={walkInCell.slot}
          startIndex={walkInCell.slotIndex}
          slots={data.slots}
          occupiedSlotIds={occupiedSlotIds(walkInCell.field.id)}
          onClose={() => setWalkInCell(null)}
          onDone={refresh}
        />
      )}

      {selected && (
        <BookingDetailDialog
          key={selected.booking_code}
          booking={selected}
          onClose={() => setSelected(null)}
          onChanged={refresh}
        />
      )}

      {manageOpen && (
        <TimeSlotManager
          onClose={() => setManageOpen(false)}
          onChanged={refresh}
        />
      )}
    </div>
  );
};

export default SchedulePage;
