import { Router } from 'express';
import { handleValidation } from '../middlewares/validate.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';
import { createStaffValidator, updateStaffValidator, staffIdValidator } from '../validators/staffValidator.js';
import * as staffController from '../controllers/staffController.js';

const router = Router();

// Halaman Staff hanya untuk admin (PRD 9.6)
router.use(requireAuth, requireRole('admin'));

router.get('/', staffController.list);

router.post('/', ...createStaffValidator, handleValidation, staffController.create);

router.patch('/:id', ...updateStaffValidator, handleValidation, staffController.update);

router.delete('/:id', ...staffIdValidator, handleValidation, staffController.remove);

router.post('/:id/reset-password', ...staffIdValidator, handleValidation, staffController.resetPassword);

export default router;
