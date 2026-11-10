import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, ArrowLeft, MapPin } from "lucide-react";
import toast from "react-hot-toast";
import Stepper from "./Stepper.jsx";
import Summary from "./Summary.jsx";
import api from "../../lib/api.js";
import { iconShift, tapScale } from "../../lib/motion.js";

const pad = (n) => String(n).padStart(2, "0");
const todayStr = new Date().toLocaleDateString("sv-SE");
const MAX_DATE = (() => {
  const d = new Date();
  d.setDate(d.getDate() + 60);
  return d.toLocaleDateString("sv-SE");
})();
const MAX_DURATION = 4;
const DURATIONS = [1, 2, 3, 4];
const PHONE_OK = (v) => /^(0|62)8\d{7,12}$/.test(v.replace(/[\s-]/g, ""));

const hourOf = (time) => parseInt(time.slice(0, 2), 10);

// Isi awal dari form Hero (?lapangan=&tanggal=&jam=&durasi=) — dibaca sekali saat init
const q = new URLSearchParams(window.location.search);
const clampDate = (t) => (t && t >= todayStr && t <= MAX_DATE ? t : todayStr);
const initFromQuery = {
  date: clampDate(q.get("tanggal")),
  fieldId: q.get("lapangan") || "",
  startHour: (() => {
    const j = parseInt(q.get("jam"), 10);
    return j >= 0 && j < 24 ? j : null;
  })(),
  duration: (() => {
    const d = +q.get("durasi");
    return d >= 1 && d <= MAX_DURATION ? d : 1;
  })(),
};

const StepButton = ({ children, className, ...props }) => (
  <motion.button
    type="submit"
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
      className="grid size-9 place-items-center rounded-full bg-white text-primary"
    >
      <ArrowRight className="size-4" />
    </motion.span>
  </motion.button>
);

const BackButton = ({ onClick }) => (
  <motion.button
    type="button"
    onClick={onClick}
    variants={tapScale}
    initial={false}
    whileHover="hover"
    whileTap="tap"
    className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground transition-colors duration-200 hover:bg-cream-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
  >
    <ArrowLeft className="size-4" />
    Kembali
  </motion.button>
);

const BookingForm = () => {
  const [step, setStep] = useState(1);

  // Step 1
  const [fields, setFields] = useState([]);
  const [fieldId, setFieldId] = useState(initFromQuery.fieldId);
  const [date, setDate] = useState(initFromQuery.date);
  const [slots, setSlots] = useState([]);
  const [slotsKey, setSlotsKey] = useState("");
  const [startHour, setStartHour] = useState(initFromQuery.startHour);
  const [duration, setDuration] = useState(initFromQuery.duration);

  // Step 2
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState({});

  // Step 3
  const [paymentType, setPaymentType] = useState("full");
  const [dpPercentage, setDpPercentage] = useState(50);
  const [maxDate, setMaxDate] = useState(MAX_DATE);
  const [submitting, setSubmitting] = useState(false);

  const selectedField = fields.find((f) => f.id === fieldId);
  const slotAt = (h) => slots.find((s) => hourOf(s.start_time) === h);

  // Berapa jam berturut-turut masih tersedia mulai dari jam h (min 1).
  const fitFrom = (h) => {
    let fit = 0;
    while (fit < MAX_DURATION && slotAt(h + fit)?.is_available) fit++;
    return Math.max(fit, 1);
  };
  const maxFit = startHour === null ? MAX_DURATION : fitFrom(startHour);
  // Durasi dipakai efektif = min(pilihan, slot yang muat) → tidak perlu effect clamp
  const effDuration = Math.min(duration, maxFit);

  // loading = request masih di jalan untuk kombinasi (fieldId, date) saat ini
  const slotsLoading = fieldId && `${fieldId}|${date}` !== slotsKey;

  const startSlot = startHour === null ? null : slotAt(startHour);
  const jam = startSlot
    ? `${startSlot.start_time.slice(0, 5)} – ${pad((startHour + effDuration) % 24)}:00`
    : null;

  const total =
    startHour === null
      ? 0
      : Array.from({ length: effDuration }, (_, i) => slotAt(startHour + i)?.price ?? 0).reduce(
          (a, b) => a + b,
          0,
        );

  // harga per jam bisa berbeda antar slot (PRD 5.1); dipakai hanya untuk teks bantuan
  const pricePerHour = startHour !== null ? slotAt(startHour)?.price : null;

  useEffect(() => {
    api
      .get("/fields")
      .then((res) => setFields(res.data.data))
      .catch(() => toast.error("Gagal memuat daftar lapangan"));
    api
      .get("/settings")
      .then((res) => {
        setDpPercentage(res.data.data.dp_percentage ?? 50);
        const days = res.data.data.booking_window_days;
        if (days > 0) {
          const d = new Date();
          d.setDate(d.getDate() + days);
          setMaxDate(d.toLocaleDateString("sv-SE"));
        }
      })
      .catch(() => {}); // fallback tetap nilai default, tidak perlu toast
  }, []);

  // Isi awal dari form Hero (?lapangan=&tanggal=&jam=&durasi=) — dibaca sekali saat init
  // (lihat initFromQuery di atas komponen)

  useEffect(() => {
    if (!fieldId || !date) return;
    const key = `${fieldId}|${date}`;
    let cancelled = false;
    api
      .get("/bookings/availability", { params: { field_id: fieldId, date } })
      .then((res) => {
        if (cancelled) return;
        const data = res.data.data;
        setSlots(data);
        setSlotsKey(key);
        // jam yang dipilih (termasuk isi awal dari URL) ternyata sudah penuh → kosongkan
        setStartHour((h) =>
          h !== null && !data.find((s) => hourOf(s.start_time) === h)?.is_available
            ? null
            : h,
        );
      })
      .catch(() => {
        if (cancelled) return;
        setSlots([]);
        setSlotsKey(key);
        toast.error("Gagal memuat ketersediaan slot");
      });
    return () => {
      cancelled = true;
    };
  }, [fieldId, date]);

  const dpAmount = Math.round((total * dpPercentage) / 100);
  const amountDue = paymentType === "dp" ? dpAmount : total;

  const booking = {
    field: selectedField,
    date,
    jam,
    duration: effDuration,
    name,
    phone,
    paymentType,
    dpPercentage,
  };

  const step1Valid = fieldId && startHour !== null && effDuration >= 1;

  const validateStep2 = () => {
    const next = {};
    if (name.trim().length < 3) next.name = "Masukkan nama minimal 3 karakter.";
    if (!PHONE_OK(phone))
      next.phone = "Masukkan nomor HP yang valid, misalnya 081234567890.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submitStep2 = (e) => {
    e.preventDefault();
    if (validateStep2()) setStep(3);
  };

  const confirm = async () => {
    setSubmitting(true);
    try {
      const res = await api.post("/bookings", {
        field_id: fieldId,
        play_date: date,
        start_time: `${pad(startHour)}:00`,
        duration_hours: effDuration,
        customer_name: name.trim(),
        customer_phone: phone.replace(/[\s-]/g, ""),
        payment_type: paymentType,
      });
      toast.success("Pesanan berhasil dibuat");
      // Halaman booking detail belum dibuat — arahkan dengan kode booking via query
      window.location.assign(`/booking-detail?kode=${res.data.data.booking_code}`);
    } catch (err) {
      const message =
        err.response?.data?.message || "Gagal membuat pesanan, coba lagi.";
      toast.error(message);
      if (err.response?.status === 409) {
        // slot bisa saja sudah diambil orang lain → segarkan ketersediaan
        setStartHour(null);
        setStep(1);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls =
    "w-full rounded-xl border border-input bg-card px-4 py-3 text-sm font-medium text-foreground outline-none focus:border-primary";

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[1.5fr_1fr]">
      <section
        aria-label="Form pemesanan"
        className="rounded-2xl bg-card p-5 sm:p-9"
      >
        <Stepper current={step} />

        {/* STEP 1: Jadwal */}
        {step === 1 && (
          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              if (step1Valid) setStep(2);
            }}
          >
            <h2 className="text-xl font-bold tracking-tight">Pilih jadwal main</h2>

            <div className="mt-6">
              <label htmlFor="tgl" className="mb-2.5 block text-sm font-semibold">
                Tanggal
              </label>
              <input
                id="tgl"
                type="date"
                className={inputCls}
                min={todayStr}
                max={maxDate}
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setStartHour(null);
                }}
                required
              />
            </div>

            <fieldset className="mt-6 min-w-0">
              <legend className="mb-2.5 text-sm font-semibold">Lapangan</legend>
              <div className="grid gap-3 sm:grid-cols-2 max-sm:grid-cols-1">
                {fields.length === 0 && (
                  <p className="text-sm text-muted-foreground">Memuat lapangan…</p>
                )}
                {fields.map((f) => (
                  <label
                    key={f.id}
                    className={`flex cursor-pointer items-center gap-2.5 rounded-xl border bg-card px-4 py-3.5 text-sm font-semibold transition-colors ${
                      fieldId === f.id
                        ? "border-primary bg-green-50 text-green-800"
                        : "border-border text-foreground hover:border-primary"
                    }`}
                  >
                    <input
                      type="radio"
                      name="lapangan"
                      value={f.id}
                      checked={fieldId === f.id}
                      onChange={() => {
                        setFieldId(f.id);
                        setStartHour(null);
                      }}
                      className="sr-only"
                    />
                    <MapPin className="size-4 shrink-0" />
                    {f.name}
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="mt-6">
              <span id="lb-slot" className="mb-2.5 block text-sm font-semibold">
                Jam mulai
              </span>
              <div
                role="group"
                aria-labelledby="lb-slot"
                className="grid grid-cols-[repeat(auto-fill,minmax(7.5rem,1fr))] gap-2"
              >
                {!fieldId ? (
                  <p className="col-span-full text-sm text-muted-foreground">
                    Pilih tanggal dan lapangan untuk melihat jam yang tersedia.
                  </p>
                ) : slotsLoading ? (
                  <p className="col-span-full text-sm text-muted-foreground">
                    Memuat slot…
                  </p>
                ) : (
                  slots.map((s) => {
                    const h = hourOf(s.start_time);
                    // slot ikut ter-select selama masih dalam rentang durasi efektif
                    const selected =
                      startHour !== null &&
                      h >= startHour &&
                      h < startHour + effDuration;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        aria-pressed={selected}
                        disabled={!s.is_available}
                        onClick={() => setStartHour(h)}
                        className={`flex flex-col items-center rounded-full border px-1 py-2.5 text-sm font-semibold leading-tight transition-colors ${
                          selected
                            ? "border-primary bg-primary text-primary-foreground"
                            : s.is_available
                              ? "border-border bg-card text-foreground hover:border-primary"
                              : "cursor-not-allowed border-border bg-cream-200 text-muted-foreground/60"
                        }`}
                      >
                        {s.start_time.slice(0, 5)} – {s.end_time.slice(0, 5)}
                        {!s.is_available && (
                          <small className="text-[0.65rem] font-medium">Tidak Tersedia</small>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            <div className="mt-6">
              <span id="lb-dur" className="mb-2.5 block text-sm font-semibold">
                Durasi
              </span>
              <div
                role="radiogroup"
                aria-labelledby="lb-dur"
                className="inline-flex flex-wrap gap-1 rounded-full bg-cream-200 p-1"
              >
                {DURATIONS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    role="radio"
                    aria-checked={d === effDuration}
                    disabled={startHour !== null && d > maxFit}
                    onClick={() => setDuration(d)}
                    className={`cursor-pointer rounded-full px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                      d === effDuration
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground"
                    }`}
                  >
                    {d} Jam
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-8 flex flex-wrap justify-end gap-3">
              <StepButton disabled={!step1Valid}>
                Lanjut
              </StepButton>
            </div>
          </form>
        )}

        {/* STEP 2: Data diri */}
        {step === 2 && (
          <form noValidate onSubmit={submitStep2}>
            <h2 className="text-xl font-bold tracking-tight">Isi data dirimu</h2>

            <div className="mt-6">
              <label htmlFor="nama" className="mb-2.5 block text-sm font-semibold">
                Nama lengkap
              </label>
              <input
                id="nama"
                autoComplete="name"
                placeholder="Contoh: Budi Santoso"
                className={inputCls}
                value={name}
                onChange={(e) => setName(e.target.value)}
                aria-invalid={!!errors.name}
              />
              {errors.name && (
                <p className="mt-1.5 text-[0.8rem] text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="mt-6">
              <label htmlFor="hp" className="mb-2.5 block text-sm font-semibold">
                Nomor HP / WhatsApp
              </label>
              <input
                id="hp"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="Contoh: 081234567890"
                className={inputCls}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                aria-invalid={!!errors.phone}
              />
              {errors.phone && (
                <p className="mt-1.5 text-[0.8rem] text-destructive">{errors.phone}</p>
              )}
            </div>

            <div className="mt-8 flex flex-wrap justify-between gap-3 max-sm:[&>*]:flex-1">
              <BackButton onClick={() => setStep(1)} />
              <StepButton>Konfirmasi Pesanan</StepButton>
            </div>
          </form>
        )}

        {/* STEP 3: Konfirmasi */}
        {step === 3 && (
          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              confirm();
            }}
          >
            <h2 className="text-xl font-bold tracking-tight">Pilih cara bayar</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Pembayaran dilakukan setelah ini lewat transfer atau QRIS.
            </p>

            <fieldset className="mt-6 min-w-0">
              <legend className="mb-2.5 text-sm font-semibold">Tipe pembayaran</legend>
              <div className="grid gap-3 sm:grid-cols-2 max-sm:grid-cols-1">
                {[
                  {
                    value: "full",
                    title: "Bayar Penuh",
                    desc: `Bayar ${new Intl.NumberFormat("id-ID", {
                      style: "currency",
                      currency: "IDR",
                      maximumFractionDigits: 0,
                    }).format(total)} sekarang`,
                  },
                  {
                    value: "dp",
                    title: `DP ${dpPercentage}%`,
                    desc: `Bayar ${new Intl.NumberFormat("id-ID", {
                      style: "currency",
                      currency: "IDR",
                      maximumFractionDigits: 0,
                    }).format(dpAmount)} sekarang, sisanya di tempat`,
                  },
                ].map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex cursor-pointer flex-col gap-1 rounded-xl border bg-card px-4 py-3.5 text-sm font-semibold transition-colors ${
                      paymentType === opt.value
                        ? "border-primary bg-green-50 text-green-800"
                        : "border-border text-foreground hover:border-primary"
                    }`}
                  >
                    <input
                      type="radio"
                      name="tipe-bayar"
                      value={opt.value}
                      checked={paymentType === opt.value}
                      onChange={() => setPaymentType(opt.value)}
                      className="sr-only"
                    />
                    {opt.title}
                    <span className="font-medium text-muted-foreground">{opt.desc}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="mt-8 flex flex-wrap justify-between gap-3 max-sm:[&>*]:flex-1">
              <BackButton onClick={() => setStep(2)} />
              <StepButton disabled={submitting}>
                {submitting ? "Memproses…" : "Buat Pesanan"}
              </StepButton>
            </div>
          </form>
        )}
      </section>

      <Summary
        booking={booking}
        total={total}
        amountDue={amountDue}
        pricePerHour={pricePerHour}
        showPayment={step === 3}
      />
    </div>
  );
};

export default BookingForm;
