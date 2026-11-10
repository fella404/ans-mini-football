import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { KeyRound, Pencil, RefreshCw, Trash2, TriangleAlert } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import EmptyState from "@/components/ui/EmptyState";
import { Switch } from "@/components/ui/switch";
import { useAuthStore } from "@/stores/useAuthStore";
import { cn } from "@/lib/utils";

const EMPTY_FORM = { id: "", name: "", email: "" };

const StaffPage = () => {
  const role = useAuthStore((s) => s.user?.role);
  const [rows, setRows] = useState([]);
  const [state, setState] = useState("loading"); // loading | done | error
  const [error, setError] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [busy, setBusy] = useState(false);
  const [confirmResetId, setConfirmResetId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  useEffect(() => {
    if (role !== "admin") return;
    let active = true;
    api
      .get("/staff")
      .then(({ data }) => {
        if (!active) return;
        setRows(data.data);
        setState("done");
      })
      .catch((err) => {
        if (!active) return;
        setError(err.response?.data?.message ?? "Gagal memuat staff.");
        setState("error");
      });
    return () => {
      active = false;
    };
  }, [role]);

  if (role !== "admin") return <Navigate to="/" replace />;

  const load = async () => {
    setState("loading");
    try {
      const { data } = await api.get("/staff");
      setRows(data.data);
      setState("done");
    } catch (err) {
      setError(err.response?.data?.message ?? "Gagal memuat staff.");
      setState("error");
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      if (form.id) {
        await api.patch(`/staff/${form.id}`, {
          name: form.name,
          email: form.email,
        });
        toast.success("Staff berhasil diperbarui");
      } else {
        await api.post("/staff", { name: form.name, email: form.email });
        toast.success("Staff berhasil ditambahkan");
      }
      setForm(EMPTY_FORM);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message ?? "Gagal menyimpan staff.");
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (row) => {
    const next = !row.is_active;
    setTogglingId(row.id);
    // Optimistic: switch langsung berubah, dikembalikan bila gagal.
    setRows((current) =>
      current.map((item) =>
        item.id === row.id ? { ...item, is_active: next } : item,
      ),
    );
    try {
      await api.patch(`/staff/${row.id}`, { is_active: next });
      toast.success(next ? "Staff diaktifkan" : "Staff dinonaktifkan");
    } catch (err) {
      setRows((current) =>
        current.map((item) =>
          item.id === row.id ? { ...item, is_active: row.is_active } : item,
        ),
      );
      toast.error(err.response?.data?.message ?? "Gagal mengubah status.");
    } finally {
      setTogglingId(null);
    }
  };

  const resetPassword = async (id) => {
    setBusy(true);
    try {
      await api.post(`/staff/${id}/reset-password`);
      toast.success("Password direset ke 12345678");
      setConfirmResetId(null);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message ?? "Gagal mereset password.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    setBusy(true);
    try {
      await api.delete(`/staff/${id}`);
      toast.success("Staff berhasil dihapus.");
      setConfirmDeleteId(null);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message ?? "Gagal menghapus staff.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-lg font-bold uppercase tracking-[0.1em] text-foreground">
          Staff
        </h1>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={load}
          disabled={busy || state === "loading"}
          aria-busy={busy}
        >
          <RefreshCw
            aria-hidden="true"
            className={cn(
              state === "loading" && "animate-spin motion-reduce:animate-none",
            )}
          />
          Perbarui
        </Button>
      </div>

      <form
        onSubmit={submit}
        className="grid gap-3 border border-border bg-card p-3 sm:grid-cols-[1fr_1fr_auto]"
      >
        <div className="grid gap-1.5">
          <Input
            id="staff-name"
            className="h-7"
            value={form.name}
            placeholder="Nama Staff"
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            required
          />
        </div>
        <div className="grid gap-1.5">
          <Input
            id="staff-email"
            className="h-7"
            type="email"
            value={form.email}
            placeholder="Email Staff"
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            required
          />
        </div>
        <div className="flex items-end gap-2">
          {form.id && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setForm(EMPTY_FORM)}
              disabled={busy}
            >
              Batal
            </Button>
          )}
          <Button type="submit" size="sm" disabled={busy} aria-busy={busy}>
            {form.id ? "Simpan" : "Tambah"}
          </Button>
        </div>
      </form>

      <section className="border border-border bg-card">
        {state === "loading" ? (
          <div role="status" className="space-y-2 p-4">
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="h-9 animate-pulse bg-muted/40 motion-reduce:animate-none"
              />
            ))}
            <span className="sr-only">Memuat staff…</span>
          </div>
        ) : state === "error" ? (
          <div role="alert" className="p-6">
            <div className="flex items-start gap-3">
              <TriangleAlert
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 text-destructive"
              />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Staff gagal dimuat
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {error}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={load}
                  className="mt-4"
                >
                  Coba lagi
                </Button>
              </div>
            </div>
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            title="Belum ada staff"
            hint="Tambahkan staff lewat form di atas."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                  <th scope="col" className="px-3 py-2 font-medium">
                    Nama
                  </th>
                  <th scope="col" className="px-3 py-2 font-medium">
                    Email
                  </th>
                  <th scope="col" className="px-3 py-2 font-medium">
                    Status
                  </th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td className="px-3 py-2 font-medium text-foreground">
                      {row.name}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {row.email}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Switch
                          size="sm"
                          checked={row.is_active}
                          disabled={togglingId === row.id}
                          onCheckedChange={() => toggleActive(row)}
                          aria-label={`${row.is_active ? "Nonaktifkan" : "Aktifkan"} staff ${row.name}`}
                        />
                        <span className="text-muted-foreground">
                          {row.is_active ? "Aktif" : "Nonaktif"}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-end gap-1">
                        {confirmResetId === row.id ? (
                          <>
                            <span className="mr-1 text-[11px] text-destructive">
                              Reset password?
                            </span>
                            <Button
                              type="button"
                              variant="destructive"
                              size="xs"
                              onClick={() => resetPassword(row.id)}
                              disabled={busy}
                            >
                              Ya
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="xs"
                              onClick={() => setConfirmResetId(null)}
                              disabled={busy}
                            >
                              Batal
                            </Button>
                          </>
                        ) : confirmDeleteId === row.id ? (
                          <>
                            <span className="mr-1 text-[11px] text-destructive">
                              Hapus?
                            </span>
                            <Button
                              type="button"
                              variant="destructive"
                              size="xs"
                              onClick={() => remove(row.id)}
                              disabled={busy}
                            >
                              Ya
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="xs"
                              onClick={() => setConfirmDeleteId(null)}
                              disabled={busy}
                            >
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
                                  name: row.name,
                                  email: row.email,
                                })
                              }
                              aria-label={`Ubah staff ${row.name}`}
                            >
                              <Pencil aria-hidden="true" />
                              Ubah
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="xs"
                              onClick={() => setConfirmResetId(row.id)}
                              aria-label={`Reset password staff ${row.name}`}
                            >
                              <KeyRound aria-hidden="true" />
                              Reset
                            </Button>
                            <Button
                              type="button"
                              variant="destructive"
                              size="xs"
                              onClick={() => setConfirmDeleteId(row.id)}
                              aria-label={`Hapus staff ${row.name}`}
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
      </section>
    </div>
  );
};

export default StaffPage;
