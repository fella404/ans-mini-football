import { useState } from "react";
import { Ban, Check, CheckCheck, MessageCircle, X } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { useBookingsStore } from "@/stores/useBookingsStore";
import { cn } from "@/lib/utils";
import {
  formatJam,
  formatRupiah,
  formatTanggal,
  formatTanggalWaktu,
} from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import StatusBadge from "@/components/ui/StatusBadge";

const CANCELLED_BY = { customer: "customer", system: "sistem", admin: "admin" };

const Field = ({ label, value }) => (
  <div>
    <dt className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
      {label}
    </dt>
    <dd className="mt-0.5 text-xs text-foreground">{value}</dd>
  </div>
);

const ReasonDialog = ({
  mode,
  open,
  busy,
  error,
  value,
  onChange,
  onSubmit,
  onClose,
}) => {
  const rejecting = mode === "reject";

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !busy) onClose();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <form onSubmit={onSubmit} noValidate>
          <DialogHeader>
            <DialogTitle className="font-heading text-xs font-bold uppercase tracking-[0.14em]">
              {rejecting ? "Tolak bukti pembayaran" : "Batalkan pesanan"}
            </DialogTitle>
            <DialogDescription className="mt-1">
              {rejecting
                ? "Pesanan kembali ke status menunggu pembayaran dan timer 30 menit diulang."
                : "Slot akan dibebaskan. Tindakan ini tidak bisa dibatalkan."}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 grid gap-1.5">
            <Label htmlFor="reason-input">
              {rejecting ? "Alasan penolakan" : "Alasan pembatalan"}
            </Label>
            <Textarea
              id="reason-input"
              rows={3}
              required
              aria-required="true"
              aria-invalid={Boolean(error) || undefined}
              aria-describedby={error ? "reason-error" : undefined}
              placeholder={
                rejecting
                  ? "Contoh: nominal transfer belum sesuai."
                  : "Contoh: customer tidak jadi bermain."
              }
              value={value}
              onChange={(event) => onChange(event.target.value)}
            />
            <p
              id="reason-error"
              role="alert"
              className="min-h-[1lh] text-[11px] leading-snug text-destructive"
            >
              {error}
            </p>
          </div>

          <DialogFooter className="mt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={busy}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="destructive"
              size="sm"
              disabled={busy}
              aria-busy={busy}
            >
              {busy
                ? "Mengirim…"
                : rejecting
                  ? "Tolak bukti"
                  : "Batalkan pesanan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const BookingDetailDialog = ({ booking, onClose, onChanged }) => {
  const code = booking.booking_code;
  const patchRow = useBookingsStore((s) => s.patchRow);
  const [busy, setBusy] = useState(""); // "" | accept | complete | reject | cancel
  const [reasonMode, setReasonMode] = useState(null); // reject | cancel
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState("");
  const [completeOpen, setCompleteOpen] = useState(false);
  const [settled, setSettled] = useState(false);

  // Dibuka dari grid jadwal: modal tampil dulu, data detail menyusul.
  if (booking.loading) {
    return (
      <Dialog
        open
        onOpenChange={(next) => {
          if (!next) onClose();
        }}
      >
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-mono text-sm tracking-[0.06em]">
              {code}
            </DialogTitle>
            <DialogDescription className="mt-1">
              Memuat detail pesanan…
            </DialogDescription>
          </DialogHeader>
          <div role="status" aria-live="polite" className="space-y-3 py-3">
            <div className="h-16 animate-pulse bg-muted/40 motion-reduce:animate-none" />
            <div className="h-24 animate-pulse bg-muted/40 motion-reduce:animate-none" />
            <span className="sr-only">Memuat detail pesanan…</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const finish = async (settledValue) => {
    setBusy("complete");
    try {
      const res = await api.post(`/bookings/${code}/complete`, {
        remaining_settled: settledValue,
      });
      patchRow(code, res.data.data); // badge tabel ikut berubah tanpa tunggu refetch
      toast.success(`Pesanan ${code} selesai.`);
      setCompleteOpen(false);
      onChanged();
      onClose();
    } catch (error) {
      toast.error(
        error.response?.data?.message ?? "Gagal menyelesaikan pesanan.",
      );
    } finally {
      setBusy("");
    }
  };

  const accept = async () => {
    setBusy("accept");
    try {
      const res = await api.post(`/bookings/${code}/accept`);
      patchRow(code, res.data.data); // badge tabel ikut berubah tanpa tunggu refetch
      toast.success(`Pesanan ${code} disetujui.`);
      onChanged();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message ?? "Gagal menyetujui pesanan.");
    } finally {
      setBusy("");
    }
  };

  const handleComplete = () => {
    if (booking.payment_type === "dp") {
      setSettled(false);
      setCompleteOpen(true);
      return;
    }
    finish(false);
  };

  const openReason = (mode) => {
    setReasonMode(mode);
    setReason("");
    setReasonError("");
  };

  const closeReason = () => {
    if (busy) return;
    setReasonMode(null);
  };

  const submitReason = async (event) => {
    event.preventDefault();
    if (!reason.trim()) {
      setReasonError("Alasan wajib diisi.");
      return;
    }

    setBusy(reasonMode);
    const rejecting = reasonMode === "reject";
    try {
      const res = await api.post(
        `/bookings/${code}/${rejecting ? "reject" : "admin-cancel"}`,
        rejecting
          ? { rejection_reason: reason.trim() }
          : { cancellation_reason: reason.trim() },
      );
      patchRow(code, res.data.data); // badge tabel ikut berubah tanpa tunggu refetch
      toast.success(
        rejecting
          ? `Bukti pesanan ${code} ditolak, timer pembayaran diulang.`
          : `Pesanan ${code} dibatalkan.`,
      );
      setReasonMode(null);
      onChanged();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message ?? "Gagal memproses pesanan.");
    } finally {
      setBusy("");
    }
  };

  const phone = booking.customer_phone;
  const isDp = booking.payment_type === "dp";

  return (
    <>
      <Dialog
        open
        onOpenChange={(next) => {
          if (!next && !busy) onClose();
        }}
      >
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <div className="flex flex-wrap items-center justify-between gap-2 pr-8">
              <div>
                <DialogTitle className="font-mono text-sm tracking-[0.06em]">
                  {code}
                </DialogTitle>
                <DialogDescription className="mt-1">
                  {formatTanggal(booking.play_date)} ·{" "}
                  {formatJam(booking.start_time)} · {booking.duration_hours} jam
                </DialogDescription>
              </div>
              <StatusBadge status={booking.status} />
            </div>
          </DialogHeader>

          <dl className="grid gap-x-4 gap-y-3 border-y border-border py-3 sm:grid-cols-2">
            <Field label="Pelanggan" value={booking.customer_name} />
            <Field label="No HP" value={phone || "—"} />
            <Field label="Lapangan" value={booking.field_name} />
            <Field
              label="Tipe bayar"
              value={isDp ? `DP ${booking.dp_percentage}%` : "Full"}
            />
            <Field label="Total" value={formatRupiah(booking.total_price)} />
            <Field label="Dibayar" value={formatRupiah(booking.amount_due)} />
            {isDp && (
              <Field
                label="Sisa"
                value={formatRupiah(booking.remaining_amount)}
              />
            )}
            {booking.is_walk_in && (
              <Field
                label="Tipe Pemesanan"
                value={booking.is_walk_in ? "Offline" : "Online"}
              />
            )}
            <Field
              label="Waktu pesan"
              value={formatTanggalWaktu(booking.created_at)}
            />
            {booking.status === "pending_payment" && booking.deadline_at && (
              <Field
                label="Batas bayar"
                value={formatTanggalWaktu(booking.deadline_at)}
              />
            )}
            {booking.status === "completed" && isDp && (
              <Field
                label="Sisa dilunasi"
                value={booking.remaining_settled ? "Ya" : "Belum"}
              />
            )}
          </dl>

          {["pending_payment", "waiting_approval"].includes(booking.status) &&
            booking.rejection_reason && (
              <p
                role="note"
                className="border border-destructive/40 bg-destructive/5 px-3 py-2 text-[11px] leading-relaxed text-destructive"
              >
                <span className="font-semibold">Bukti ditolak: </span>
                {booking.rejection_reason}
              </p>
            )}

          {booking.status === "cancelled" && (
            <p
              role="note"
              className="border border-border bg-muted/40 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground"
            >
              <span className="font-semibold text-foreground">
                Dibatalkan:{" "}
              </span>
              oleh {CANCELLED_BY[booking.cancelled_by] ?? "sistem"}
              {booking.cancellation_reason
                ? ` — ${booking.cancellation_reason}`
                : "."}
            </p>
          )}

          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Bukti transfer
            </p>
            {booking.proof_signed_url ? (
              <a
                href={booking.proof_signed_url}
                target="_blank"
                rel="noreferrer"
                aria-label={`Buka bukti transfer ${booking.customer_name} di tab baru`}
                className="mt-2 inline-block border border-border transition-opacity hover:opacity-80"
              >
                <img
                  src={booking.proof_signed_url}
                  alt={`Bukti transfer ${booking.customer_name}`}
                  className="max-h-64 w-auto object-contain"
                />
              </a>
            ) : (
              <p className="mt-1.5 text-xs text-muted-foreground">
                Belum ada bukti transfer.
              </p>
            )}
          </div>

          <DialogFooter className="flex flex-wrap items-center justify-between gap-2 sm:flex-row">
            <div>
              {phone && (
                <a
                  href={`https://wa.me/${phone}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-7 items-center gap-1.5 border border-border px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <MessageCircle aria-hidden="true" className="size-3.5" />
                  Chat WA
                </a>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {booking.status === "waiting_approval" && (
                <>
                  <Button
                    type="button"
                    size="sm"
                    onClick={accept}
                    disabled={Boolean(busy)}
                    aria-busy={busy === "accept"}
                  >
                    <Check aria-hidden="true" />
                    {busy === "accept" ? "Memproses…" : "Accept"}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => openReason("reject")}
                    disabled={Boolean(busy)}
                  >
                    <X aria-hidden="true" />
                    Reject
                  </Button>
                </>
              )}

              {booking.status === "PAID" && (
                <>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleComplete}
                    disabled={Boolean(busy)}
                    aria-busy={busy === "complete"}
                    className={cn(busy === "complete" && "opacity-60")}
                  >
                    <CheckCheck aria-hidden="true" />
                    {busy === "complete" ? "Memproses…" : "Selesai"}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => openReason("cancel")}
                    disabled={Boolean(busy)}
                  >
                    <Ban aria-hidden="true" />
                    Batalkan
                  </Button>
                </>
              )}

              {booking.status === "pending_payment" && (
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={() => openReason("cancel")}
                  disabled={Boolean(busy)}
                >
                  <Ban aria-hidden="true" />
                  Batalkan
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ReasonDialog
        mode={reasonMode}
        open={Boolean(reasonMode)}
        busy={Boolean(busy)}
        error={reasonError}
        value={reason}
        onChange={(value) => {
          setReason(value);
          if (reasonError) setReasonError("");
        }}
        onSubmit={submitReason}
        onClose={closeReason}
      />

      <Dialog
        open={completeOpen}
        onOpenChange={(next) => {
          if (!next && !busy) setCompleteOpen(false);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-xs font-bold uppercase tracking-[0.14em]">
              Selesaikan pesanan
            </DialogTitle>
            <DialogDescription className="mt-1">
              Pesanan DP ini masih punya sisa{" "}
              {formatRupiah(booking.remaining_amount)}. Catat pelunasan di
              tempat sebelum menandai selesai.
            </DialogDescription>
          </DialogHeader>

          <label className="mt-4 flex items-start gap-2 text-xs text-foreground">
            <input
              type="checkbox"
              checked={settled}
              onChange={(event) => setSettled(event.target.checked)}
              className="mt-0.5 size-3.5 accent-primary"
            />
            Sisa sudah dilunasi
          </label>

          <DialogFooter className="mt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCompleteOpen(false)}
              disabled={busy === "complete"}
            >
              Batal
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => finish(settled)}
              disabled={busy === "complete"}
              aria-busy={busy === "complete"}
            >
              {busy === "complete" ? "Memproses…" : "Selesaikan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BookingDetailDialog;
