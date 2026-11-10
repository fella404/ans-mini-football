import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, MessageCircle, X } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import { formatJam, formatRupiah, formatTanggalPendek } from "@/lib/format";
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
import EmptyState from "@/components/ui/EmptyState";

const ActionNeededTable = ({ rows, onChanged }) => {
  const [busyCode, setBusyCode] = useState("");
  const [rejecting, setRejecting] = useState(null);
  const [reason, setReason] = useState("");
  const [formError, setFormError] = useState("");
  const [rejectBusy, setRejectBusy] = useState(false);

  const accept = async (code) => {
    setBusyCode(code);
    try {
      await api.post(`/bookings/${code}/accept`);
      toast.success(`Pesanan ${code} disetujui.`);
      await onChanged();
    } catch (error) {
      toast.error(
        error.response?.data?.message ?? "Gagal menyetujui pesanan.",
      );
    } finally {
      setBusyCode("");
    }
  };

  const openReject = (row) => {
    setRejecting(row);
    setReason("");
    setFormError("");
  };

  const closeReject = () => {
    if (rejectBusy) return;
    setRejecting(null);
  };

  const submitReject = async (event) => {
    event.preventDefault();
    if (!reason.trim()) {
      setFormError("Alasan penolakan wajib diisi.");
      return;
    }

    setRejectBusy(true);
    try {
      await api.post(`/bookings/${rejecting.booking_code}/reject`, {
        rejection_reason: reason.trim(),
      });
      toast.success(`Bukti pesanan ${rejecting.booking_code} ditolak.`);
      setRejecting(null);
      await onChanged();
    } catch (error) {
      setFormError(
        error.response?.data?.message ?? "Gagal menolak bukti pembayaran.",
      );
    } finally {
      setRejectBusy(false);
    }
  };

  return (
    <section
      aria-labelledby="action-title"
      className="border border-border bg-card"
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
        <div className="flex items-center gap-2">
          <h2
            id="action-title"
            className="font-heading text-xs font-bold uppercase tracking-[0.14em] text-foreground"
          >
            Perlu Verifikasi
          </h2>
          {rows.length > 0 && (
            <span className="border border-border px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground tabular-nums">
              {rows.length}
            </span>
          )}
        </div>
        <Link
          to="/pesanan?status=waiting_approval"
          className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Lihat semua
          <ArrowRight aria-hidden="true" className="size-3" />
        </Link>
      </header>

      {rows.length === 0 ? (
        <EmptyState
          title="Tidak ada pesanan yang perlu diverifikasi"
          hint="Pesanan dengan bukti pembayaran baru akan muncul di sini."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[52rem] text-left text-xs">
            <caption className="sr-only">
              Pesanan yang menunggu verifikasi pembayaran
            </caption>
            <thead>
              <tr className="border-b border-border text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                <th scope="col" className="px-4 py-2.5 font-medium">
                  Pemesan
                </th>
                <th scope="col" className="px-4 py-2.5 font-medium">
                  Lapangan
                </th>
                <th scope="col" className="px-4 py-2.5 font-medium">
                  Jadwal
                </th>
                <th scope="col" className="px-4 py-2.5 font-medium">
                  Total
                </th>
                <th scope="col" className="px-4 py-2.5 font-medium">
                  Bukti
                </th>
                <th scope="col" className="px-4 py-2.5 text-right font-medium">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row) => (
                <tr
                  key={row.booking_code}
                  className="align-middle transition-colors hover:bg-muted/40"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">
                      {row.customer_name}
                    </p>
                    <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <span className="tabular-nums">{row.customer_phone}</span>
                      <a
                        href={`https://wa.me/${row.customer_phone}`}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Chat WhatsApp ${row.customer_name}`}
                        className="transition-colors hover:text-foreground"
                      >
                        <MessageCircle aria-hidden="true" className="size-3" />
                      </a>
                    </div>
                    <p className="mt-1 font-mono text-[10px] tracking-[0.06em] text-muted-foreground">
                      {row.booking_code}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {row.field_name}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-foreground">
                      {formatTanggalPendek(row.play_date)}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground tabular-nums">
                      {formatJam(row.start_time)}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground tabular-nums">
                      {formatRupiah(row.total_price)}
                    </p>
                    <p className="mt-0.5 text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                      {row.payment_type === "dp" ? "DP" : "Full"}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    {row.proof_signed_url ? (
                      <a
                        href={row.proof_signed_url}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Buka bukti transfer ${row.customer_name}`}
                        className="inline-block border border-border"
                      >
                        <img
                          src={row.proof_signed_url}
                          alt={`Bukti transfer ${row.customer_name}`}
                          loading="lazy"
                          className="h-10 w-14 object-cover"
                        />
                      </a>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1.5">
                      <Button
                        type="button"
                        size="xs"
                        disabled={busyCode === row.booking_code}
                        onClick={() => accept(row.booking_code)}
                        aria-label={`Setujui pesanan ${row.booking_code}`}
                        className={cn(
                          "gap-1",
                          busyCode === row.booking_code && "opacity-60",
                        )}
                      >
                        <Check aria-hidden="true" className="size-3" />
                        Setujui
                      </Button>
                      <Button
                        type="button"
                        size="xs"
                        variant="destructive"
                        disabled={busyCode === row.booking_code}
                        onClick={() => openReject(row)}
                        aria-label={`Tolak bukti pesanan ${row.booking_code}`}
                        className="gap-1"
                      >
                        <X aria-hidden="true" className="size-3" />
                        Tolak
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog
        open={Boolean(rejecting)}
        onOpenChange={(open) => {
          if (!open) closeReject();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <form onSubmit={submitReject} noValidate>
            <DialogHeader>
              <DialogTitle className="font-heading text-xs font-bold uppercase tracking-[0.14em]">
                Tolak bukti pembayaran
              </DialogTitle>
              <DialogDescription className="mt-1">
                {rejecting
                  ? `Pesanan ${rejecting.booking_code} atas nama ${rejecting.customer_name} akan kembali ke status menunggu pembayaran.`
                  : ""}
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 grid gap-1.5">
              <Label htmlFor="rejection-reason">Alasan penolakan</Label>
              <Textarea
                id="rejection-reason"
                name="rejection_reason"
                rows={3}
                required
                aria-required="true"
                aria-invalid={Boolean(formError) || undefined}
                aria-describedby={formError ? "rejection-error" : undefined}
                placeholder="Contoh: nominal transfer belum sesuai."
                value={reason}
                onChange={(event) => {
                  setReason(event.target.value);
                  if (formError) setFormError("");
                }}
              />
              <p
                id="rejection-error"
                role="alert"
                className="min-h-[1lh] text-[11px] leading-snug text-destructive"
              >
                {formError}
              </p>
            </div>

            <DialogFooter className="mt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={closeReject}
                disabled={rejectBusy}
              >
                Batal
              </Button>
              <Button
                type="submit"
                variant="destructive"
                size="sm"
                disabled={rejectBusy}
                aria-busy={rejectBusy}
              >
                {rejectBusy ? "Mengirim…" : "Tolak bukti"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default ActionNeededTable;
