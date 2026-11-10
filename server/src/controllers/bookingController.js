import * as bookingService from '../services/bookingService.js';
import { toCsv } from '../lib/csv.js';

export async function availability(req, res) {
  const data = await bookingService.availability(req.query.field_id, req.query.date);
  res.json({ success: true, data, message: 'OK' });
}

export async function create(req, res) {
  const data = await bookingService.create(req.body);
  res.status(201).json({ success: true, data, message: 'Pesanan berhasil dibuat' });
}

export async function createWalkIn(req, res) {
  const data = await bookingService.create(req.body, { walkIn: true });
  res.status(201).json({ success: true, data, message: 'Pesanan walk-in berhasil dibuat' });
}

export async function list(req, res) {
  const { rows, meta } = await bookingService.list(req.query);
  res.json({ success: true, data: rows, message: 'OK', meta });
}

export async function get(req, res) {
  const data = await bookingService.get(req.params.booking_code);
  res.json({ success: true, data, message: 'OK' });
}

export async function uploadProof(req, res) {
  const data = await bookingService.uploadProof(req.params.booking_code, req.file);
  res.json({ success: true, data, message: 'Bukti pembayaran berhasil diunggah' });
}

export async function cancel(req, res) {
  const data = await bookingService.cancel(req.params.booking_code, req.body?.cancellation_reason);
  res.json({ success: true, data, message: 'Pesanan berhasil dibatalkan' });
}

export async function accept(req, res) {
  const data = await bookingService.accept(req.params.booking_code);
  res.json({ success: true, data, message: 'Pembayaran disetujui' });
}

export async function reject(req, res) {
  const data = await bookingService.reject(req.params.booking_code, req.body.rejection_reason);
  res.json({ success: true, data, message: 'Bukti ditolak, timer pembayaran diulang' });
}

export async function complete(req, res) {
  const data = await bookingService.complete(req.params.booking_code, req.body.remaining_settled);
  res.json({ success: true, data, message: 'Pesanan selesai' });
}

export async function adminCancel(req, res) {
  const data = await bookingService.adminCancel(
    req.params.booking_code,
    req.body.cancellation_reason,
    req.user.id,
  );
  res.json({ success: true, data, message: 'Pesanan berhasil dibatalkan' });
}

// CSV langsung sebagai body (bukan envelope JSON) agar bisa di-download (PRD 9.7)
export async function exportCsv(req, res) {
  const rows = await bookingService.exportList(req.query);
  const headers = [
    'kode', 'tanggal_pesan', 'nama', 'no_hp', 'lapangan',
    'tanggal_main', 'jam', 'total', 'tipe_bayar', 'status',
  ];
  const csv = toCsv(headers, rows.map((r) => [
    r.booking_code, r.booked_at, r.customer_name, r.customer_phone, r.field_name,
    r.play_date, r.play_time, r.total_price, r.payment_type, r.status,
  ]));

  const from = req.query.date_from || 'all';
  const to = req.query.date_to || 'all';
  res.set('Content-Type', 'text/csv; charset=utf-8');
  res.set('Content-Disposition', `attachment; filename="bookings-${from}-${to}.csv"`);
  res.send(csv);
}
