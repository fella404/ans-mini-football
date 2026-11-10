import * as scheduleService from '../services/scheduleService.js';
import { wibToday } from '../services/bookingPricing.js';

export async function index(req, res) {
  const data = await scheduleService.getSchedule(req.query.date || wibToday());
  res.json({ success: true, data, message: 'OK' });
}
