import { useState } from "react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import {
  availableDurations,
  isSlotEnded as slotEnded,
  totalPriceFor,
} from "@/lib/schedule";
import { formatJam, formatRupiah } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ToolbarSelect from "@/components/ui/ToolbarSelect";

const WalkInDialog = ({ date, field, slot, startIndex, slots, occupiedSlotIds, onClose, onDone }) => {
  const durations = availableDurations({
    slots,
    startIndex,
    occupiedSlotIds,
    isSlotEnded: (item) => slotEnded(date, item.end_time),
  });
  const [duration, setDuration] = useState(durations[0] ?? 1);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);

  const price = totalPriceFor(slots, startIndex, duration);

  const submit = async (event) => {
    event.preventDefault();
    if (!name.trim()) return;

    setBusy(true);
    try {
      const { data } = await api.post("/bookings/walk-in", {
        field_id: field.id,
        play_date: date,
        start_time: slot.start_time,
        duration_hours: duration,
        customer_name: name.trim(),
        customer_phone: phone.trim() || undefined,
      });
      toast.success(`Walk-in ${data.data.booking_code} tercatat.`);
      onDone();
      onClose();
    } catch (error) {
      const conflict = error.response?.status === 409;
      toast.error(
        conflict
          ? "Slot sudah dipesan, pilih jam lain"
          : error.response?.data?.message ?? "Gagal menyimpan walk-in.",
      );
      if (conflict) {
        onDone();
        onClose();
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open onOpenChange={(next) => !next && !busy && onClose()}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit} noValidate>
          <DialogHeader>
            <DialogTitle className="font-heading text-xs font-bold uppercase tracking-[0.14em]">
              Walk-in
            </DialogTitle>
            <DialogDescription className="mt-1">
              {field.name} · {formatJam(slot.start_time)}–{formatJam(slot.end_time)} ·{" "}
              {formatRupiah(slot.price)}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="walkin-name">Nama</Label>
              <Input
                id="walkin-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoFocus
                required
                aria-required="true"
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="walkin-phone">No HP (opsional)</Label>
              <Input
                id="walkin-phone"
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="08xx"
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="walkin-duration">Durasi</Label>
              <ToolbarSelect
                id="walkin-duration"
                items={durations.map((value) => ({
                  value,
                  label: `${value} jam`,
                }))}
                value={duration}
                onChange={setDuration}
                ariaLabel="Durasi"
                triggerClassName="w-full"
                popupClassName="min-w-[var(--anchor-width)]"
              />
            </div>

            <p className="border border-border bg-muted/40 px-3 py-2 text-[11px] text-muted-foreground">
              Total <span className="font-semibold text-foreground">{formatRupiah(price)}</span> · langsung{" "}
              <span className="font-semibold text-foreground">Lunas (Full)</span>, tanpa WA.
            </p>
          </div>

          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={busy}>
              Batal
            </Button>
            <Button type="submit" size="sm" disabled={busy || !name.trim()} aria-busy={busy}>
              {busy ? "Menyimpan…" : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default WalkInDialog;
