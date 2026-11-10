import * as settingsService from '../services/settingsService.js';

export async function get(req, res) {
  const data = await settingsService.get();
  res.json({ success: true, data, message: 'OK' });
}

export async function update(req, res) {
  const { dp_percentage, booking_window_days, bank_name, bank_account_number, bank_account_holder } = req.body;
  const data = await settingsService.update(
    { dp_percentage, booking_window_days, bank_name, bank_account_number, bank_account_holder },
    req.user.id,
  );
  res.json({ success: true, data, message: 'Pengaturan berhasil diperbarui' });
}

export async function uploadQris(req, res) {
  const data = await settingsService.setQris(req.file);
  res.json({ success: true, data, message: 'Gambar QRIS berhasil diperbarui' });
}
