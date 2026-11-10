import { useEffect, useRef, useState } from "react";
import { KeyRound, RefreshCw, TriangleAlert } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/stores/useAuthStore";
import { formatTanggalWaktu } from "@/lib/format";
import { cn } from "@/lib/utils";

const EMPTY_PAY = {
  dp_percentage: "",
  booking_window_days: "",
  bank_name: "",
  bank_account_number: "",
  bank_account_holder: "",
};

const EMPTY_PW = { oldPassword: "", newPassword: "", confirmPassword: "" };

const CARD =
  "space-y-4 border border-border bg-card p-4 sm:p-5";

const SettingsPage = () => {
  const role = useAuthStore((s) => s.user?.role);
  const isAdmin = role === "admin";

  const [state, setState] = useState("loading"); // loading | done | error
  const [error, setError] = useState("");
  const [payForm, setPayForm] = useState(EMPTY_PAY);
  const [qrisUrl, setQrisUrl] = useState("");
  const [updatedAt, setUpdatedAt] = useState(null);
  const [payBusy, setPayBusy] = useState(false);
  const [qrisBusy, setQrisBusy] = useState(false);
  const [pwForm, setPwForm] = useState(EMPTY_PW);
  const [pwBusy, setPwBusy] = useState(false);
  const fileRef = useRef(null);

  const apply = (data) => {
    setPayForm({
      dp_percentage: String(data.dp_percentage ?? ""),
      booking_window_days: String(data.booking_window_days ?? ""),
      bank_name: data.bank_name ?? "",
      bank_account_number: data.bank_account_number ?? "",
      bank_account_holder: data.bank_account_holder ?? "",
    });
    setQrisUrl(data.qris_image_url ?? "");
    setUpdatedAt(data.updated_at ?? null);
  };

  useEffect(() => {
    let active = true;
    api
      .get("/settings")
      .then(({ data }) => {
        if (!active) return;
        apply(data.data);
        setState("done");
      })
      .catch((err) => {
        if (!active) return;
        setError(err.response?.data?.message ?? "Gagal memuat pengaturan.");
        setState("error");
      });
    return () => {
      active = false;
    };
  }, []);

  const load = async () => {
    setState("loading");
    try {
      const { data } = await api.get("/settings");
      apply(data.data);
      setState("done");
    } catch (err) {
      setError(err.response?.data?.message ?? "Gagal memuat pengaturan.");
      setState("error");
    }
  };

  const submitPassword = async (event) => {
    event.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error("Konfirmasi password tidak sama");
      return;
    }
    setPwBusy(true);
    try {
      await api.patch("/auth/change-password", pwForm);
      toast.success("Password berhasil diubah");
      setPwForm(EMPTY_PW);
    } catch (err) {
      toast.error(err.response?.data?.message ?? "Gagal mengubah password.");
    } finally {
      setPwBusy(false);
    }
  };

  const submitPayment = async (event) => {
    event.preventDefault();
    setPayBusy(true);
    try {
      await api.patch("/settings", {
        dp_percentage: Number(payForm.dp_percentage),
        booking_window_days: Number(payForm.booking_window_days),
        bank_name: payForm.bank_name,
        bank_account_number: payForm.bank_account_number,
        bank_account_holder: payForm.bank_account_holder,
      });
      toast.success("Pengaturan berhasil diperbarui");
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message ?? "Gagal menyimpan pengaturan.");
    } finally {
      setPayBusy(false);
    }
  };

  const uploadQris = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setQrisBusy(true);
    try {
      const body = new FormData();
      body.append("file", file);
      await api.post("/settings/qris", body);
      toast.success("Gambar QRIS berhasil diperbarui");
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message ?? "Gagal mengunggah QRIS.");
    } finally {
      setQrisBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-lg font-bold uppercase tracking-[0.1em] text-foreground">
          Pengaturan
        </h1>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={load}
          disabled={state === "loading"}
          aria-busy={state === "loading"}
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

      {state === "loading" ? (
        <div role="status" className={cn(CARD, "space-y-3")}>
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="h-9 animate-pulse bg-muted/40 motion-reduce:animate-none"
            />
          ))}
          <span className="sr-only">Memuat pengaturan…</span>
        </div>
      ) : state === "error" ? (
        <div role="alert" className={CARD}>
          <div className="flex items-start gap-3">
            <TriangleAlert
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0 text-destructive"
            />
            <div>
              <p className="text-sm font-semibold text-foreground">
                Pengaturan gagal dimuat
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
      ) : (
        <>
          {isAdmin && (
            <form onSubmit={submitPayment} className={CARD}>
              <div>
                <h2 className="font-heading text-xs font-bold uppercase tracking-[0.14em] text-foreground">
                  Data Pembayaran
                </h2>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="pay-bank">Nama bank</Label>
                  <Input
                    id="pay-bank"
                    className="h-7"
                    value={payForm.bank_name}
                    onChange={(event) =>
                      setPayForm({ ...payForm, bank_name: event.target.value })
                    }
                    required
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="pay-number">Nomor rekening</Label>
                  <Input
                    id="pay-number"
                    className="h-7"
                    value={payForm.bank_account_number}
                    onChange={(event) =>
                      setPayForm({
                        ...payForm,
                        bank_account_number: event.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="pay-holder">Atas nama</Label>
                  <Input
                    id="pay-holder"
                    className="h-7"
                    value={payForm.bank_account_holder}
                    onChange={(event) =>
                      setPayForm({
                        ...payForm,
                        bank_account_holder: event.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="pay-dp">Persentase DP (%)</Label>
                  <Input
                    id="pay-dp"
                    className="h-7"
                    type="number"
                    min="1"
                    max="100"
                    value={payForm.dp_percentage}
                    onChange={(event) =>
                      setPayForm({
                        ...payForm,
                        dp_percentage: event.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="pay-window">Batas hari pemesanan</Label>
                  <Input
                    id="pay-window"
                    className="h-7"
                    type="number"
                    min="1"
                    value={payForm.booking_window_days}
                    onChange={(event) =>
                      setPayForm({
                        ...payForm,
                        booking_window_days: event.target.value,
                      })
                    }
                    required
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                {qrisUrl ? (
                  <img
                    src={qrisUrl}
                    alt="QRIS"
                    className="size-28 border border-border bg-background object-contain p-1"
                  />
                ) : (
                  <div className="grid size-28 place-items-center border border-dashed border-border text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                    Belum ada QRIS
                  </div>
                )}
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    JPG atau PNG, maksimal 2 MB.
                  </p>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png"
                    className="sr-only"
                    onChange={uploadQris}
                    aria-label="Unggah gambar QRIS"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileRef.current?.click()}
                    disabled={qrisBusy}
                    aria-busy={qrisBusy}
                  >
                    {qrisUrl ? "Ganti QRIS" : "Unggah QRIS"}
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
                <p className="text-[11px] text-muted-foreground">
                  Diperbarui terakhir: {formatTanggalWaktu(updatedAt)}
                </p>
                <Button type="submit" size="sm" disabled={payBusy} aria-busy={payBusy}>
                  Simpan
                </Button>
              </div>
            </form>
          )}

          <form onSubmit={submitPassword} className={CARD}>
            <div>
              <h2 className="font-heading text-xs font-bold uppercase tracking-[0.14em] text-foreground">
                Ganti Password
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Password baru minimal 8 karakter.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="grid gap-1.5">
                <Label htmlFor="pw-old">Password lama</Label>
                <Input
                  id="pw-old"
                  className="h-7"
                  type="password"
                  autoComplete="current-password"
                  value={pwForm.oldPassword}
                  onChange={(event) =>
                    setPwForm({ ...pwForm, oldPassword: event.target.value })
                  }
                  required
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="pw-new">Password baru</Label>
                <Input
                  id="pw-new"
                  className="h-7"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  value={pwForm.newPassword}
                  onChange={(event) =>
                    setPwForm({ ...pwForm, newPassword: event.target.value })
                  }
                  required
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="pw-confirm">Konfirmasi password baru</Label>
                <Input
                  id="pw-confirm"
                  className="h-7"
                  type="password"
                  autoComplete="new-password"
                  value={pwForm.confirmPassword}
                  onChange={(event) =>
                    setPwForm({ ...pwForm, confirmPassword: event.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="flex justify-end border-t border-border pt-3">
              <Button type="submit" size="sm" disabled={pwBusy} aria-busy={pwBusy}>
                <KeyRound aria-hidden="true" />
                Ganti Password
              </Button>
            </div>
          </form>
        </>
      )}
    </div>
  );
};

export default SettingsPage;
