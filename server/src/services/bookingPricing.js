import crypto from 'node:crypto';

// Alfabet tanpa 0/O dan 1/I (PRD 5.2)
export const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

// 08xx → 62xxx untuk WA gateway (PRD 5.2); kosong untuk walk-in
export function normalizePhone(phone) {
  if (!phone) return '';
  return phone.startsWith('0') ? `62${phone.slice(1)}` : phone;
}

export function generateCode() {
  let code = '';
  for (let i = 0; i < 8; i++) code += CODE_ALPHABET[crypto.randomInt(CODE_ALPHABET.length)];
  return code;
}

// amount_due & remaining sesuai payment_type dan dp_percentage (PRD 5.3)
export function computeAmounts(totalPrice, paymentType, dpPercentage) {
  if (paymentType === 'dp') {
    const amountDue = Math.round((totalPrice * dpPercentage) / 100);
    return {
      payment_type: 'dp',
      dp_percentage: dpPercentage,
      amount_due: amountDue,
      remaining_amount: totalPrice - amountDue,
    };
  }
  return { payment_type: 'full', dp_percentage: null, amount_due: totalPrice, remaining_amount: 0 };
}

const pad2 = (n) => String(n).padStart(2, '0');
const fmtYMD = (y, m, d) => `${y}-${pad2(m)}-${pad2(d)}`;
const WIB_MS = 7 * 3600 * 1000; // WIB = UTC+7, tidak bergantung timezone server

// "Sekarang" versi WIB (digeser dari UTC); baca lewat getUTC* agar konsisten
export const wibNow = () => new Date(Date.now() + WIB_MS);
export function wibToday() {
  const d = wibNow();
  return fmtYMD(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
}
export function wibTimeNow() {
  const d = wibNow();
  return `${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}:00`;
}
// play_date dari pg berupa Date local-midnight; ambil bagian kalendernya apa adanya
export function ymdOf(date) {
  return fmtYMD(date.getFullYear(), date.getMonth() + 1, date.getDate());
}
