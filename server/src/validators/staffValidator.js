import { body, param } from 'express-validator';

export const createStaffValidator = [
  body('name').trim().notEmpty().withMessage('Nama staff wajib diisi'),
  body('email').trim().toLowerCase().isEmail().withMessage('Email tidak valid'),
];

export const updateStaffValidator = [
  param('id').isUUID().withMessage('ID staff tidak valid'),
  body('name').optional().trim().notEmpty().withMessage('Nama staff tidak boleh kosong'),
  body('email').optional().trim().toLowerCase().isEmail().withMessage('Email tidak valid'),
  body('is_active').optional().isBoolean().toBoolean().withMessage('is_active harus boolean'),
];

export const staffIdValidator = [param('id').isUUID().withMessage('ID staff tidak valid')];
