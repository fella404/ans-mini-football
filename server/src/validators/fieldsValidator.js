import { body, param } from 'express-validator';

export const createFieldValidator = [
  body('name').trim().notEmpty().withMessage('Nama lapangan wajib diisi'),
];

export const updateFieldValidator = [
  param('id').isUUID().withMessage('ID lapangan tidak valid'),
  body('name').optional().trim().notEmpty().withMessage('Nama lapangan tidak boleh kosong'),
  body('is_active').optional().isBoolean().toBoolean().withMessage('is_active harus boolean'),
];

export const fieldIdValidator = [param('id').isUUID().withMessage('ID lapangan tidak valid')];
