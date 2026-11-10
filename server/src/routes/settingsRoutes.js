import { Router } from 'express';
import multer from 'multer';
import { handleValidation } from '../middlewares/validate.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';
import { updateSettingsValidator } from '../validators/settingsValidator.js';
import * as settingsController from '../controllers/settingsController.js';

const router = Router();

const adminOnly = [requireAuth, requireRole('admin')];
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 } });

router.get('/', settingsController.get);

router.patch('/', ...adminOnly, ...updateSettingsValidator, handleValidation, settingsController.update);

router.post('/qris', ...adminOnly, upload.single('file'), settingsController.uploadQris);

export default router;
