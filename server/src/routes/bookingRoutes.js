import { Router } from 'express';
import multer from 'multer';
import { handleValidation } from '../middlewares/validate.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';
import {
  createBookingValidator,
  walkInValidator,
  availabilityValidator,
  listBookingsValidator,
  exportBookingsValidator,
  bookingCodeValidator,
  rejectValidator,
  cancelValidator,
  adminCancelValidator,
  completeValidator,
} from '../validators/bookingsValidator.js';
import * as bookingController from '../controllers/bookingController.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 } });
const staffOnly = [requireAuth, requireRole('admin', 'staff')];
const adminOnly = [requireAuth, requireRole('admin')];

// Statik route harus di atas /:booking_code (PRD 8.2, 9.4)
router.get('/availability', ...availabilityValidator, handleValidation, bookingController.availability);

// Export CSV, hanya admin (PRD 9.7) — di atas /:booking_code
router.get('/export', ...adminOnly, ...exportBookingsValidator, handleValidation, bookingController.exportCsv);

router.post('/', ...createBookingValidator, handleValidation, bookingController.create);

router.post('/walk-in', ...staffOnly, ...walkInValidator, handleValidation, bookingController.createWalkIn);

router.get('/', ...staffOnly, ...listBookingsValidator, handleValidation, bookingController.list);

// Semua di bawah ini diakses lewat kode booking (PRD 8.3)
router.get('/:booking_code', ...bookingCodeValidator, handleValidation, bookingController.get);

router.post('/:booking_code/proof', ...bookingCodeValidator, handleValidation, upload.single('file'), bookingController.uploadProof);

router.post('/:booking_code/cancel', ...cancelValidator, handleValidation, bookingController.cancel);

router.post('/:booking_code/accept', ...staffOnly, ...bookingCodeValidator, handleValidation, bookingController.accept);

router.post('/:booking_code/reject', ...staffOnly, ...rejectValidator, handleValidation, bookingController.reject);

router.post('/:booking_code/complete', ...staffOnly, ...completeValidator, handleValidation, bookingController.complete);

router.post('/:booking_code/admin-cancel', ...staffOnly, ...adminCancelValidator, handleValidation, bookingController.adminCancel);

export default router;
