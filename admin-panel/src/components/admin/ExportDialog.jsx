import { useState } from "react";
import { Download, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ToolbarSelect from "@/components/ui/ToolbarSelect";
import { ALL_STATUS, STATUS_ITEMS } from "@/lib/status";

const EMPTY_FORM = { date_from: "", date_to: "", status: "" };

const ExportDialog = ({ onClose }) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [busy, setBusy] = useState(false);

  const setField = (key) => (event) =>
    setForm({ ...form, [key]: event.target.value });

  const submit = async (event) => {
    event.preventDefault();
    if (form.date_from && form.date_to && form.date_to < form.date_from) {
      toast.error("Tanggal akhir tidak boleh sebelum tanggal awal");
      return;
    }
    // Param kosong dibuang: server menolak bila semua filter kosong (422).
    const params = Object.fromEntries(
      Object.entries(form).filter(([, value]) => value !== ""),
    );
    setBusy(true);
    try {
      const { data } = await api.get("/bookings/export", {
        params,
        responseType: "blob",
      });
      const url = URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = url;
      // Konvensi nama sama seperti Content-Disposition server (bookingController.exportCsv).
      link.download = `bookings-${form.date_from || "all"}-${form.date_to || "all"}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("CSV berhasil diunduh");
      onClose();
    } catch (err) {
      // Error JSON dibungkus blob oleh responseType, baca ulang dari teksnya.
      let message = "Gagal mengunduh CSV.";
      try {
        message = JSON.parse(await err.response.data.text()).message ?? message;
      } catch {
        // biarkan fallback
      }
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open onOpenChange={(next) => !next && !busy && onClose()}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle className="font-heading text-xs font-bold uppercase tracking-[0.14em]">
              Export CSV
            </DialogTitle>
          </DialogHeader>

          <div className="mt-4 grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="export-from">Tanggal main dari</Label>
              <Input
                id="export-from"
                type="date"
                value={form.date_from}
                onChange={setField("date_from")}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="export-to">Tanggal main sampai</Label>
              <Input
                id="export-to"
                type="date"
                value={form.date_to}
                onChange={setField("date_to")}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="export-status">Status</Label>
              <ToolbarSelect
                id="export-status"
                items={STATUS_ITEMS}
                value={form.status || ALL_STATUS}
                onChange={(next) =>
                  setForm({ ...form, status: next === ALL_STATUS ? "" : next })
                }
                ariaLabel="Status pesanan yang diekspor"
                triggerClassName="w-full"
                popupClassName="w-full"
              />
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={busy}
            >
              Batal
            </Button>
            <Button type="submit" size="sm" disabled={busy} aria-busy={busy}>
              {busy ? (
                <RefreshCw
                  aria-hidden="true"
                  className="animate-spin motion-reduce:animate-none"
                />
              ) : (
                <Download aria-hidden="true" />
              )}
              Download
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ExportDialog;
