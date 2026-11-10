import { Router } from 'express';
import { handleValidation } from '../middlewares/validate.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';
import { createFieldValidator, updateFieldValidator, fieldIdValidator } from '../validators/fieldsValidator.js';
import * as fieldController from '../controllers/fieldController.js';

const router = Router();

const adminOnly = [requireAuth, requireRole('admin')];

router.get('/', fieldController.list);

router.get('/all', requireAuth, requireRole('admin', 'staff'), fieldController.listAll);

router.post('/', ...adminOnly, ...createFieldValidator, handleValidation, fieldController.create);

router.patch('/:id', ...adminOnly, ...updateFieldValidator, handleValidation, fieldController.update);

router.delete('/:id', ...adminOnly, ...fieldIdValidator, handleValidation, fieldController.remove);

export default router;
