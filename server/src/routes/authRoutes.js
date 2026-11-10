import { Router } from 'express';
import { handleValidation } from '../middlewares/validate.js';
import { requireAuth } from '../middlewares/auth.js';
import { loginValidator, changePasswordValidator } from '../validators/authValidator.js';
import * as authController from '../controllers/authController.js';

const router = Router();

router.post('/login', ...loginValidator, handleValidation, authController.login);

router.post('/logout', authController.logout);

router.get('/me', requireAuth, authController.me);

router.patch(
  '/change-password',
  requireAuth,
  ...changePasswordValidator,
  handleValidation,
  authController.changePassword,
);

export default router;
