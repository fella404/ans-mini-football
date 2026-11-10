import { body } from 'express-validator';

export const updateSettingsValidator = [
  body('dp_percentage').optional().isInt({ min: 1, max: 100 }).withMessage('Persentase DP harus 1-100'),
  body('booking_window_days').optional().isInt({ min: 1 }).withMessage('Batas hari minimal 1'),
  body('bank_name').optional({ values: 'null' }).trim().notEmpty().withMessage('Nama bank tidak boleh kosong'),
  body('bank_account_number').optional({ values: 'null' }).trim().notEmpty().withMessage('Nomor rekening tidak boleh kosong'),
  body('bank_account_holder').optional({ values: 'null' }).trim().notEmpty().withMessage('Atas nama tidak boleh kosong'),
];
