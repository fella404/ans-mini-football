import { body, param } from 'express-validator';

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

export const createTimeSlotValidator = [
  body('start_time').matches(TIME_REGEX).withMessage('Jam mulai tidak valid (HH:MM)'),
  body('end_time').matches(TIME_REGEX).withMessage('Jam selesai tidak valid (HH:MM)'),
  body('price').isInt({ min: 0 }).withMessage('Tarif harus angka >= 0'),
  body('is_active').optional().isBoolean().toBoolean().withMessage('is_active harus boolean'),
];

export const updateTimeSlotValidator = [
  param('id').isUUID().withMessage('ID slot jam tidak valid'),
  body('start_time').optional().matches(TIME_REGEX).withMessage('Jam mulai tidak valid (HH:MM)'),
  body('end_time').optional().matches(TIME_REGEX).withMessage('Jam selesai tidak valid (HH:MM)'),
  body('price').optional().isInt({ min: 0 }).withMessage('Tarif harus angka >= 0'),
  body('is_active').optional().isBoolean().toBoolean().withMessage('is_active harus boolean'),
];

export const timeSlotIdValidator = [param('id').isUUID().withMessage('ID slot jam tidak valid')];
