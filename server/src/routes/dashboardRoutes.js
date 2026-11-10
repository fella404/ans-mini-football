import { Router } from 'express';
import { requireAuth, requireRole } from '../middlewares/auth.js';
import * as dashboardController from '../controllers/dashboardController.js';

const router = Router();

// Ringkasan dashboard untuk admin & staff (PRD 9.2)
router.get('/', requireAuth, requireRole('admin', 'staff'), dashboardController.index);

export default router;
