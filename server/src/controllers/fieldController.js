import * as fieldService from '../services/fieldService.js';

export async function list(req, res) {
  const data = await fieldService.listActive();
  res.json({ success: true, data, message: 'OK' });
}

export async function listAll(req, res) {
  const data = await fieldService.listAll();
  res.json({ success: true, data, message: 'OK' });
}

export async function create(req, res) {
  const data = await fieldService.create(req.body.name);
  res.status(201).json({ success: true, data, message: 'Lapangan berhasil ditambahkan' });
}

export async function update(req, res) {
  const { name, is_active } = req.body;
  const data = await fieldService.update(req.params.id, { name, is_active });
  res.json({ success: true, data, message: 'Lapangan berhasil diperbarui' });
}

export async function remove(req, res) {
  await fieldService.remove(req.params.id);
  res.json({ success: true, data: null, message: 'Lapangan berhasil dihapus' });
}
