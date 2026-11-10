import * as dashboardService from '../services/dashboardService.js';

export async function index(req, res) {
  const data = await dashboardService.getDashboard(req.query.month);
  res.json({ success: true, data, message: 'OK' });
}
