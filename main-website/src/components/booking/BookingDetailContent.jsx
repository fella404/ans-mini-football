import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Clock, Upload } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../lib/api.js";
import { EASE, iconShift, tapScale } from "../../lib/motion.js";

const idr = (n) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(n ?? 0));

const pad = (n) => String(n).padStart(2, "0");

// Warna & teks banner per status (mockup detail.html).
// "expired" versi mockup tidak ada di server — cron menjatuhkannya ke "cancelled".
const STATUS = {
  pending_payment: {
    label: "Menunggu Pembayaran",
    desc: "Belum ada pembayaran, atau bukti transfer sebelumnya ditolak admin. Selesaikan pembayaran dan unggah bukti yang valid sebelum waktu habis.",
    tone: "bg-amber-100 text-amber-800",
  },
  waiting_approval: {
    label: "Menunggu Persetujuan",
    desc: "Bukti pembayaran sudah kami terima. Admin sedang memeriksa pembayaranmu.",
    tone: "bg-blue-100 text-blue-700",
  },
  PAID: {
    label: "Sudah Dibayar",
    desc: "Pembayaran sudah dikonfirmasi. Silahkan datang ke lapangan sebelum jadwal dimulai.",
    tone: "bg-green-100 text-green-700",
  },
  completed: {
    label: "Selesai",
    desc: "Pesanan sudah selesai. Terima kasih sudah bermain di ANS Mini Football.",
    tone: "bg-primary text-primary-foreground",
  },
  cancelled: {
    label: "Dibatalkan",
    desc: "Pesanan ini sudah dibatalkan.",
    tone: "bg-red-100 text-red-800",
  },
};

const PrimaryButton = ({ children, className = "", ...props }) => (
  <motion.button
    variants={tapScale}
    initial={false}
    whileHover="hover"
    whileTap="tap"
    className={`inline-flex cursor-pointer items-center gap-3 rounded-full bg-primary py-1.5 pr-1.5 pl-5 text-sm font-semibold text-primary-foreground transition-colors duration-200 hover:bg-green-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-45 ${className}`}
    {...props}
  >
    {children}
    <motion.span
      variants={iconShift}
      className="grid size-9 shrink-0 place-items-center rounded-full bg-white text-primary"
    >
      <ArrowUpRight className="size-4" />
    </motion.span>
  </motion.button>
);

const GhostButton = ({ children, className = "", ...props }) => (
  <motion.button
    variants={tapScale}
    initial={false}
    whileHover="hover"
    whileTap="tap"
    className={`inline-flex cursor-pointer items-center rounded-full border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground transition-colors duration-200 hover:bg-cream-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${className}`}
    {...props}
  >
    {children}
  </motion.button>
);

const CopyButton = ({ value }) => {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() =>
        navigator.clipboard
          ?.writeText(value)
          .then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          })
          .catch(() => {})
      }
      className="shrink-0 cursor-pointer rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-primary transition-colors hover:bg-green-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      {copied ? "Tersalin" : "Salin"}
    </button>
  );
};

const Row = ({ label, children }) => (
  <div className="flex items-center justify-between gap-4 border-b border-dashed border-border py-2.5 text-sm last:border-b-0">
    <dt className="shrink-0 text-muted-foreground">{label}</dt>
    <dd className="flex min-w-0 items-center justify-end gap-2 text-right font-semibold break-all">
      {children}
    </dd>
  </div>
);

const Modal = ({ open, onClose, labelId, children }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: EASE }}
          onClick={onClose}
          className="fixed inset-0 z-50 grid place-items-center bg-foreground/50 p-4"
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={labelId}
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="w-full max-w-md rounded-2xl bg-card p-6 shadow-float"
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const BookingDetailContent = () => {
  const [params] = useSearchParams();
  const kode = params.get("kode")?.replace(/\s+/g, "").toUpperCase() || null;

  const [booking, setBooking] = useState(null);
  const [settings, setSettings] = useState(null);
  const [error, setError] = useState(null);
  const [left, setLeft] = useState(null); // ms tersisa countdown, null = belum dihitung
  const [uploadOpen, setUploadOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelBusy, setCancelBusy] = useState(false);

  // bukti DP
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [fileErr, setFileErr] = useState("");
  const [uploading, setUploading] = useState(false);

  const load = useCallback(() => {
    if (!kode) return;
    api
      .get(`/bookings/${kode}`)
      .then((res) => {
        setBooking(res.data.data);
        setError(null);
      })
      .catch(() => setError("Pesanan tidak ditemukan atau tautannya tidak valid."));
  }, [kode]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    api
      .get("/settings")
      .then((res) => setSettings(res.data.data))
      .catch(() => {}); // tanpa settings, info rekening tampil "—"
  }, []);

  const isPending = booking?.status === "pending_payment";

  // Hitung mundur batas unggah bukti; server cron yang membatalkan saat lewat,
  // jadi sesaat setelah 00:00 status dimuat ulang.
  useEffect(() => {
    if (!isPending || !booking?.deadline_at) return;
    const end = new Date(booking.deadline_at).getTime();
    const tick = () => setLeft(Math.max(0, end - Date.now()));
    tick();
    const iv = setInterval(tick, 1000);
    const to = setTimeout(load, Math.max(end - Date.now(), 0) + 1500);
    return () => {
      clearInterval(iv);
      clearTimeout(to);
    };
  }, [isPending, booking?.deadline_at, load]);

  const closeUpload = () => {
    setUploadOpen(false);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setFile(null);
    setFileErr("");
  };

  const onPickFile = (e) => {
    const f = e.target.files[0];
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setFile(null);
    setFileErr("");
    if (!f) return;
    // batasan sama dengan server (storage.js): JPG/PNG maks 2 MB
    if (!["image/jpeg", "image/png"].includes(f.type))
      return setFileErr("Format file harus JPG atau PNG.");
    if (f.size > 2 * 1024 * 1024) return setFileErr("Ukuran file maksimal 2 MB.");
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const submitProof = async (e) => {
    e.preventDefault();
    if (!file) {
      setFileErr("Pilih file bukti transfer terlebih dahulu.");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await api.post(`/bookings/${booking.booking_code}/proof`, fd);
      setBooking(res.data.data);
      toast.success("Bukti pembayaran berhasil diunggah");
      closeUpload();
    } catch (err) {
      setFileErr(err.response?.data?.message || "Gagal mengunggah bukti, coba lagi.");
    } finally {
      setUploading(false);
    }
  };

  const confirmCancel = async () => {
    setCancelBusy(true);
    try {
      const res = await api.post(`/bookings/${booking.booking_code}/cancel`);
      setBooking(res.data.data);
      toast.success("Pesanan berhasil dibatalkan");
      setCancelOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal membatalkan pesanan.");
    } finally {
      setCancelBusy(false);
    }
  };

  // Kode di-render, bukan di-effect: menghindari setState sinkron dalam effect
  const missingCode = !kode;

  if (missingCode || error) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl bg-card p-8 text-center">
        <h2 className="text-xl font-bold tracking-tight">Pesanan tidak ditemukan</h2>
        <p className="mt-2 text-pretty text-sm text-muted-foreground">
          {missingCode ? "Kode booking tidak ada pada tautan ini." : error}
        </p>
        <Link
          to="/pesan-lapangan"
          className="mt-6 inline-flex cursor-pointer items-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors duration-200 hover:bg-green-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          Pesan Lapangan
        </Link>
      </div>
    );
  }

  if (!booking) {
    return <p className="text-sm text-muted-foreground">Memuat pesanan…</p>;
  }

  const st = STATUS[booking.status] ?? {
    label: booking.status,
    desc: "",
    tone: "bg-cream-200 text-foreground",
  };
  const isDp = booking.payment_type === "dp";
  const buktiLabel = isDp ? "Bukti DP" : "Bukti Pembayaran";
  const startHour = parseInt(booking.start_time, 10);
  const jam = `${booking.start_time.slice(0, 5)} – ${pad((startHour + booking.duration_hours) % 24)}:00`;
  const phone = booking.customer_phone?.startsWith("62")
    ? `0${booking.customer_phone.slice(2)}`
    : booking.customer_phone;
  const cd = `${pad(Math.floor(left / 60000))}:${pad(Math.floor((left % 60000) / 1000))}`;

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[1.5fr_1fr]">
      <section
        aria-label="Status dan pembayaran"
        className="rounded-2xl bg-card p-5 sm:p-9"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-muted-foreground">Kode Booking</div>
            <div className="mt-0.5 flex items-center gap-3">
              <strong className="text-2xl font-extrabold tracking-[0.04em] sm:text-3xl">
                {booking.booking_code}
              </strong>
              <CopyButton value={booking.booking_code} />
            </div>
          </div>
          <span className={`rounded-full px-4 py-1.5 text-sm font-bold ${st.tone}`}>
            {st.label}
          </span>
        </div>

        <div
          role="status"
          className={`mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl p-5 sm:gap-6 ${st.tone}`}
        >
          <div className="min-w-0">
            <h2 className="text-[1.05rem] font-bold">{st.label}</h2>
            <p className="mt-1 w-full text-sm opacity-90">{st.desc}</p>
            {isPending && booking.rejection_reason && (
              <b className="mt-2 block max-w-md text-[0.95rem] font-bold">
                Alasan penolakan: {booking.rejection_reason}
              </b>
            )}
            {booking.status === "cancelled" && booking.cancellation_reason && (
              <b className="mt-2 block max-w-md text-[0.95rem] font-bold">
                Alasan pembatalan: {booking.cancellation_reason}
              </b>
            )}
          </div>
          {isPending && left !== null && (
            <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-amber-800">
              <Clock className="size-4" />
              Sisa waktu
              <b className="text-[1.1rem] tabular-nums">{cd}</b>
            </div>
          )}
        </div>

        {isPending && (
          <>
            <h2 className="mt-8 text-xl font-bold tracking-tight">
              Cara pembayaran {isDp ? "DP" : ""}
            </h2>
            <ol className="mt-4 grid gap-4">
              {[
                <>
                  Transfer <b>{idr(booking.amount_due)}</b> ke rekening{" "}
                  <b>
                    {settings?.bank_name ?? "—"} {settings?.bank_account_number ?? "—"}
                  </b>{" "}
                  a.n. <b>{settings?.bank_account_holder ?? "—"}</b>, atau scan QRIS dengan
                  nominal yang sama.
                </>,
                <>
                  Unggah bukti transfer dengan klik tombol <b>Upload {buktiLabel}</b>. Setelah
                  bukti terkirim, status pesanan berubah menjadi menunggu persetujuan.
                </>,
                <>
                  Batas waktu unggah bukti adalah <b>30 menit</b> sejak kode booking dibuat.
                  Jika lewat, booking hangus.
                </>,
              ].map((step, i) => (
                <li key={i} className="relative pl-11 text-[0.95rem] leading-relaxed">
                  <span className="absolute left-0 top-0 grid size-8 place-items-center rounded-full bg-green-50 text-sm font-bold text-primary">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>

            <div className="mt-5 rounded-2xl border border-border px-5 py-1">
              <dl>
                <Row label="Bank">{settings?.bank_name || "—"}</Row>
                <Row label="No. rekening">
                  {settings?.bank_account_number || "—"}
                  {settings?.bank_account_number && (
                    <CopyButton value={settings.bank_account_number} />
                  )}
                </Row>
                <Row label="Atas nama">{settings?.bank_account_holder || "—"}</Row>
                <Row label={`Nominal ${isDp ? "DP" : "bayar"}`}>
                  {idr(booking.amount_due)}
                </Row>
              </dl>
              <details className="border-t border-dashed border-border">
                <summary className="cursor-pointer py-3 text-sm font-semibold text-primary">
                  Bayar dengan QRIS
                </summary>
                {settings?.qris_image_url ? (
                  <img
                    src={settings.qris_image_url}
                    alt="QRIS ANS Mini Football"
                    className="mx-auto mb-4 w-64 max-w-full rounded-xl"
                  />
                ) : (
                  <div className="mx-auto mb-4 grid w-64 max-w-full place-items-center rounded-xl border-2 border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                    QRIS belum tersedia
                  </div>
                )}
              </details>
            </div>

            <div className="mt-8 flex flex-wrap justify-between gap-3 max-sm:[&>*]:flex-1">
              <PrimaryButton onClick={() => setUploadOpen(true)}>
                Upload {buktiLabel}
              </PrimaryButton>
              <GhostButton
                className="border-red-200 text-destructive hover:bg-red-50"
                onClick={() => setCancelOpen(true)}
              >
                Batalkan
              </GhostButton>
            </div>
          </>
        )}
      </section>

      <aside
        aria-label="Ringkasan pesanan"
        className="sticky top-24 rounded-2xl bg-card p-5 sm:p-8 max-lg:static"
      >
        <h2 className="mb-2 text-xl font-bold tracking-tight">Ringkasan Pesanan</h2>
        <dl>
          <Row label="Lapangan">{booking.field_name}</Row>
          <Row label="Tanggal">
            {new Date(`${booking.play_date}T00:00`).toLocaleDateString("id-ID", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </Row>
          <Row label="Jam main">{jam}</Row>
          <Row label="Durasi">{booking.duration_hours} jam</Row>
          <Row label="Nama">{booking.customer_name}</Row>
          <Row label="No. HP">{phone || "—"}</Row>
          <Row label="Total">{idr(booking.total_price)}</Row>
          <Row label="Sisa pembayaran">{idr(booking.remaining_amount)}</Row>
        </dl>
        <div className="mt-4 flex items-baseline justify-between gap-4 border-t-2 border-border pt-4">
          <span>{isDp ? `DP (${booking.dp_percentage}%)` : "Bayar penuh"}</span>
          <strong className="text-2xl font-bold tracking-tight text-primary">
            {idr(booking.amount_due)}
          </strong>
        </div>
      </aside>

      {/* Modal upload bukti */}
      <Modal open={uploadOpen} onClose={closeUpload} labelId="t-upload">
        <form noValidate onSubmit={submitProof}>
          <h2 id="t-upload" className="text-xl font-bold tracking-tight">
            Upload {buktiLabel}
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Unggah foto atau tangkapan layar bukti transfer sebesar{" "}
            <b className="text-foreground">{idr(booking.amount_due)}</b>.
          </p>
          <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-border p-4 text-sm text-muted-foreground transition-colors hover:border-primary focus-within:border-primary">
            <Upload className="size-5 shrink-0 text-primary" />
            <span className="min-w-0 break-all">
              {file ? file.name : "Pilih file (JPG atau PNG, maks. 2 MB)"}
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png"
              onChange={onPickFile}
              className="sr-only"
            />
          </label>
          {preview && (
            <img
              src={preview}
              alt="Pratinjau bukti transfer"
              className="mt-3 max-h-48 w-full rounded-xl bg-cream-200 object-contain"
            />
          )}
          {fileErr && <p className="mt-2 text-[0.85rem] text-destructive">{fileErr}</p>}
          <div className="mt-6 flex flex-wrap justify-between gap-3 max-sm:[&>*]:flex-1">
            <GhostButton type="button" onClick={closeUpload}>
              Batal
            </GhostButton>
            <PrimaryButton type="submit" disabled={uploading}>
              {uploading ? "Mengunggah…" : "Kirim Bukti"}
            </PrimaryButton>
          </div>
        </form>
      </Modal>

      {/* Modal konfirmasi batal */}
      <Modal open={cancelOpen} onClose={() => setCancelOpen(false)} labelId="t-cancel">
        <h2 id="t-cancel" className="text-xl font-bold tracking-tight">
          Batalkan pesanan?
        </h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Pesanan dengan kode <b className="text-foreground">{booking.booking_code}</b> akan
          dibatalkan dan tindakan ini tidak dapat diurungkan.
        </p>
        <div className="mt-6 flex flex-wrap justify-between gap-3 max-sm:[&>*]:flex-1">
          <GhostButton type="button" onClick={() => setCancelOpen(false)}>
            Tidak
          </GhostButton>
          <PrimaryButton
            className="bg-destructive hover:bg-red-700"
            disabled={cancelBusy}
            onClick={confirmCancel}
          >
            {cancelBusy ? "Memproses…" : "Ya, Batalkan"}
          </PrimaryButton>
        </div>
      </Modal>
    </div>
  );
};

export default BookingDetailContent;
