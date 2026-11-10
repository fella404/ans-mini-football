import * as timeSlotService from '../services/timeSlotService.js';

export async function list(req, res) {
  const data = await timeSlotService.listActive();
  res.json({ success: true, data, message: 'OK' });
}

export async function listAll(req, res) {
  const data = await timeSlotService.listAll();
  res.json({ success: true, data, message: 'OK' });
}

export async function create(req, res) {
  const { start_time, end_time, price, is_active } = req.body;
  const data = await timeSlotService.create({ start_time, end_time, price, is_active });
  res.status(201).json({ success: true, data, message: 'Slot jam berhasil ditambahkan' });
}

export async function update(req, res) {
  const { start_time, end_time, price, is_active } = req.body;
  const data = await timeSlotService.update(req.params.id, { start_time, end_time, price, is_active });
  res.json({ success: true, data, message: 'Slot jam berhasil diperbarui' });
}

export async function remove(req, res) {
  await timeSlotService.remove(req.params.id);
  res.json({ success: true, data: null, message: 'Slot jam berhasil dihapus' });
}
