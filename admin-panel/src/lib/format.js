const JAKARTA = "Asia/Jakarta";

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const tanggalPanjang = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: JAKARTA,
});

const tanggalPendek = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: JAKARTA,
});

const bulanPanjang = new Intl.DateTimeFormat("id-ID", {
  month: "long",
  year: "numeric",
  timeZone: JAKARTA,
});

const tanggalWaktu = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: JAKARTA,
});

// Tanggal dari API berupa "YYYY-MM-DD" (WIB), jadi parse eksplisit agar tidak bergeser zona.
const parseDate = (date) => new Date(`${date}T00:00:00+07:00`);

export const wibToday = () =>
  new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: JAKARTA,
  }).format(new Date());

export const wibMonth = () => wibToday().slice(0, 7);

export const wibTimeNow = () =>
  new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
    timeZone: JAKARTA,
  }).format(new Date());

export const formatRupiah = (value) => rupiah.format(Number(value) || 0);

export const formatTanggal = (date) => tanggalPanjang.format(parseDate(date));

export const formatTanggalPendek = (date) => tanggalPendek.format(parseDate(date));

export const formatBulan = (month) => bulanPanjang.format(parseDate(`${month}-01`));

export const formatTanggalWaktu = (value) =>
  value ? tanggalWaktu.format(new Date(value)) : "—";

// start_time dari Postgres berupa "19:00:00".
export const formatJam = (time) => String(time ?? "").slice(0, 5);

// start_time "19:00:00" + durasi jam → jam selesai "21:00" (dipakai halaman detail).
export const endJam = (time, hours) => {
  const [h, m] = String(time ?? "0").split(":").map(Number);
  const minutes = (h + Number(hours)) * 60 + (m || 0);
  return `${String(Math.floor(minutes / 60) % 24).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
};
