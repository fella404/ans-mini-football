import { useEffect, useState } from "react";
import { Pencil, Trash2, TriangleAlert } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { formatJam, formatRupiah } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

const EMPTY_FORM = { id: "", start_time: "", end_time: "", price: "", is_active: true };

const TimeSlotManager = ({ onClose, onChanged }) => {
  const [rows, setRows] = useState([]);
  const [state, setState] = useState("loading"); // loading | done | error
  const [error, setError] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [busy, setBusy] = useState(false);
  const [confirmId, setConfirmId] = useState(null);

  useEffect(() => {
    let active = true;
    api
      .get("/time-slots/all")
      .then(({ data }) => {
        if (!active) return;
        setRows(data.data);
        setState("done");
      })
      .catch((err) => {
        if (!active) return;
        setError(err.response?.data?.message ?? "Gagal memuat slot jam.");
        setState("error");
      });
    return () => {
      active = false;
    };
  }, []);

  const load = async () => {
    try {
      const { data } = await api.get("/time-slots/all");
      setRows(data.data);
      setState("done");
    } catch (err) {
      setError(err.response?.data?.message ?? "Gagal memuat slot jam.");
      setState("error");
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    const payload = {
      start_time: form.start_time,
      end_time: form.end_time,
      price: Number(form.price),
      is_active: form.is_active,
    };
    try {
      if (form.id) {
        await api.patch(`/time-slots/${form.id}`, payload);
        toast.success("Slot jam diperbarui.");
      } else {
        await api.post("/time-slots", payload);
        toast.success("Slot jam ditambahkan.");
      }
      setForm(EMPTY_FORM);
      await load();
      onChanged();
    } catch (err) {
      toast.error(err.response?.data?.message ?? "Gagal menyimpan slot jam.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    setBusy(true);
    try {
      await api.delete(`/time-slots/${id}`);
      toast.success("Slot jam dihapus.");
      setConfirmId(null);
      await load();
      onChanged();
    } catch (err) {
      toast.error(err.response?.data?.message ?? "Gagal menghapus slot jam.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open onOpenChange={(next) => !next && !busy && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-xs font-bold uppercase tracking-[0.14em]">
            Kelola Jadwal
          </DialogTitle>
          <DialogDescription className="mt-1">
            Ubah jam hanya untuk slot yang belum dipakai pesanan.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="grid gap-3 border border-border p-3 sm:grid-cols-4">
          <div className="grid gap-1.5">
            <Label htmlFor="slot-start">Jam mulai</Label>
            <Input
              id="slot-start"
              className="h-7"
              type="time"
              value={form.start_time}
              onChange={(event) => setForm({ ...form, start_time: event.target.value })}
              required
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="slot-end">Jam selesai</Label>
            <Input
              id="slot-end"
              className="h-7"
              type="time"
              value={form.end_time}
              onChange={(event) => setForm({ ...form, end_time: event.target.value })}
              required
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="slot-price">Tarif</Label>
            <Input
              id="slot-price"
              className="h-7"
              type="number"
              min="0"
              value={form.price}
              onChange={(event) => setForm({ ...form, price: event.target.value })}
              required
            />
          </div>
          <div className="flex items-end justify-between gap-2">
            <div className="flex h-7 items-center">
              <Switch
                size="sm"
                id="slot-active"
                checked={form.is_active}
                onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
                aria-label="Aktif"
              />
            </div>
            <div className="flex gap-2">
              {form.id && (
                <Button type="button" variant="outline" size="sm" onClick={() => setForm(EMPTY_FORM)} disabled={busy}>
                  Batal
                </Button>
              )}
              <Button type="submit" size="sm" disabled={busy} aria-busy={busy}>
                {form.id ? "Simpan" : "Tambah"}
              </Button>
            </div>
          </div>
        </form>

        {state === "loading" ? (
          <p role="status" className="py-6 text-center text-xs text-muted-foreground">
            Memuat slot jam…
          </p>
        ) : state === "error" ? (
          <div role="alert" className="flex items-start gap-2 py-4 text-xs text-destructive">
            <TriangleAlert aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        ) : rows.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted-foreground">Belum ada slot jam.</p>
        ) : (
          <div className="overflow-x-auto border border-border">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                  <th scope="col" className="px-3 py-2 font-medium">Jam</th>
                  <th scope="col" className="px-3 py-2 font-medium">Tarif</th>
                  <th scope="col" className="px-3 py-2 font-medium">Status</th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td className="px-3 py-2 whitespace-nowrap tabular-nums">
                      {formatJam(row.start_time)}–{formatJam(row.end_time)}
                    </td>
                    <td className="px-3 py-2 tabular-nums">{formatRupiah(row.price)}</td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {row.is_active ? "Aktif" : "Nonaktif"}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-end gap-1">
                        {confirmId === row.id ? (
                          <>
                            <span className="mr-1 text-[11px] text-destructive">Hapus?</span>
                            <Button type="button" variant="destructive" size="xs" onClick={() => remove(row.id)} disabled={busy}>
                              Ya
                            </Button>
                            <Button type="button" variant="outline" size="xs" onClick={() => setConfirmId(null)} disabled={busy}>
                              Batal
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              type="button"
                              variant="outline"
                              size="xs"
                              onClick={() =>
                                setForm({
                                  id: row.id,
                                  start_time: formatJam(row.start_time),
                                  end_time: formatJam(row.end_time),
                                  price: String(row.price),
                                  is_active: row.is_active,
                                })
                              }
                              aria-label={`Ubah slot ${formatJam(row.start_time)}`}
                            >
                              <Pencil aria-hidden="true" />
                              Ubah
                            </Button>
                            <Button
                              type="button"
                              variant="destructive"
                              size="xs"
                              onClick={() => setConfirmId(row.id)}
                              aria-label={`Hapus slot ${formatJam(row.start_time)}`}
                            >
                              <Trash2 aria-hidden="true" />
                              Hapus
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TimeSlotManager;
