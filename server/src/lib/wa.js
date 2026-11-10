import { config } from "../config/env.js";

// Gateway: Fonnte (https://docs.fonnte.com/api-send-message/)
// - POST https://api.fonnte.com/send, header `Authorization: <token>` (tanpa Bearer)
// - body form-urlencoded: target (string nomor 62xxx), message
// Fire and forget (PRD 10): kegagalan kirim cukup dicatat di log, tidak boleh menggagalkan pesanan.
async function sendWa(phone, message) {
  if (!config.fonnteToken || !phone) return; // token belum diisi / tanpa nomor (walk-in)

  try {
    const res = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: { Authorization: config.fonnteToken },
      body: new URLSearchParams({ target: phone, message }),
    });
    const data = await res.json().catch(() => null);
    // Fonnte sukses = { status: true }; gagal selalu status:false meski HTTP 200
    if (!res.ok || data?.status === false) {
      console.error("WA gagal dikirim:", data?.reason ?? `HTTP ${res.status}`);
    }
  } catch (err) {
    console.error("Gagal kirim WA:", err.message);
  }
}

const rp = (n) => `Rp ${Number(n).toLocaleString("id-ID")}`;
// play_date dari pg = Date local-midnight; pakai bagian kalender lokal, jangan toISOString (bisa geser hari)
const fmtDate = (value) => {
  const d =
    value instanceof Date
      ? value
      : new Date(`${String(value).slice(0, 10)}T00:00:00`);
  const p = (n) => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
};
const fmtTime = (t) => t.slice(0, 5);

function summary(booking) {
  return [
    `Kode booking: ${booking.booking_code}`,
    `Lapangan: ${booking.field_name}`,
    `Tanggal: ${fmtDate(booking.play_date)}`,
    `Jam: ${fmtTime(booking.start_time)} (${booking.duration_hours} jam)`,
    `Total: ${rp(booking.total_price)}`,
  ].join("\n");
}

// WA #1: pesanan dibuat (PRD 10)
export function sendBookingCreated(booking) {
  return sendWa(
    booking.customer_phone,
    [
      `Halo ${booking.customer_name}, pesanan Anda sudah dibuat!`,
      "",
      summary(booking),
      `Nominal dibayar: ${rp(booking.amount_due)}`,
      "Segera unggah bukti pembayaran dalam 30 menit:",
      `${config.appUrl}/booking/${booking.booking_code}`,
    ].join("\n"),
  );
}

// WA #2: pembayaran disetujui (PRD 10)
export function sendBookingApproved(booking) {
  const sisa =
    booking.payment_type === "dp" && booking.remaining_amount > 0
      ? `\nSisa pembayaran ${rp(booking.remaining_amount)} dilunasi di tempat.`
      : "";
  return sendWa(
    booking.customer_phone,
    [
      `Halo ${booking.customer_name}, pembayaran pesanan Anda sudah disetujui!`,
      "",
      summary(booking),
      `Jadwal terkonfirmasi. Pastikan datang 15 menit sebelum jadwal anda di mulai!${sisa}`,
    ].join("\n"),
  );
}
