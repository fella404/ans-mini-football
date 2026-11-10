import { Router } from 'express';
import { requireAuth, requireRole } from '../middlewares/auth.js';
import { handleValidation } from '../middlewares/validate.js';
import { scheduleQueryValidator } from '../validators/scheduleValidator.js';
import * as scheduleController from '../controllers/scheduleController.js';

const router = Router();

// Jadwal harian untuk admin & staff (PRD 9.4)
router.get(
  '/',
  requireAuth,
  requireRole('admin', 'staff'),
  ...scheduleQueryValidator,
  handleValidation,
  scheduleController.index,
);

export default router;
