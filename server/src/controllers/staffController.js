import * as staffService from '../services/staffService.js';

export async function list(req, res) {
  const data = await staffService.list();
  res.json({ success: true, data, message: 'OK' });
}

export async function create(req, res) {
  const { name, email } = req.body;
  const data = await staffService.create(name, email);
  res.status(201).json({ success: true, data, message: 'Staff berhasil ditambahkan' });
}

export async function update(req, res) {
  const { name, email, is_active } = req.body;
  const data = await staffService.update(req.params.id, { name, email, is_active });
  res.json({ success: true, data, message: 'Staff berhasil diperbarui' });
}

export async function remove(req, res) {
  await staffService.remove(req.params.id);
  res.json({ success: true, data: null, message: 'Staff berhasil dihapus' });
}

export async function resetPassword(req, res) {
  const data = await staffService.resetPassword(req.params.id);
  res.json({ success: true, data, message: 'Password staff direset ke 12345678' });
}
