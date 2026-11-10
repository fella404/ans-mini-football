import { Router } from 'express';
import { pool } from '../config/db.js';
import authRoutes from './authRoutes.js';
import fieldRoutes from './fieldRoutes.js';
import timeSlotRoutes from './timeSlotRoutes.js';
import settingsRoutes from './settingsRoutes.js';
import staffRoutes from './staffRoutes.js';
import bookingRoutes from './bookingRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';
import scheduleRoutes from './scheduleRoutes.js';

const router = Router();

router.get('/health', async (req, res) => {
  await pool.query('select 1');
  res.json({ success: true, data: { status: 'ok' }, message: 'OK' });
});

router.use('/auth', authRoutes);
router.use('/fields', fieldRoutes);
router.use('/time-slots', timeSlotRoutes);
router.use('/settings', settingsRoutes);
router.use('/staff', staffRoutes);
router.use('/bookings', bookingRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/schedule', scheduleRoutes);

export default router;
