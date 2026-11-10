import { Router } from 'express';
import { handleValidation } from '../middlewares/validate.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';
import {
  createTimeSlotValidator,
  updateTimeSlotValidator,
  timeSlotIdValidator,
} from '../validators/timeSlotsValidator.js';
import * as timeSlotController from '../controllers/timeSlotController.js';

const router = Router();

const adminOnly = [requireAuth, requireRole('admin')];

router.get('/', timeSlotController.list);

router.get('/all', requireAuth, requireRole('admin', 'staff'), timeSlotController.listAll);

router.post('/', ...adminOnly, ...createTimeSlotValidator, handleValidation, timeSlotController.create);

router.patch('/:id', ...adminOnly, ...updateTimeSlotValidator, handleValidation, timeSlotController.update);

router.delete('/:id', ...adminOnly, ...timeSlotIdValidator, handleValidation, timeSlotController.remove);

export default router;
