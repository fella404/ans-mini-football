import { body, param, query } from 'express-validator';

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;
const PHONE_REGEX = /^(0|62)8\d{7,12}$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const codeParam = param('booking_code')
  .trim()
  .isLength({ min: 4, max: 16 })
  .withMessage('Kode booking tidak valid');

const bookingFields = [
  body('field_id').isUUID().withMessage('Lapangan tidak valid'),
  body('play_date').matches(DATE_REGEX).withMessage('Tanggal tidak valid (YYYY-MM-DD)'),
  body('start_time').matches(TIME_REGEX).withMessage('Jam mulai tidak valid (HH:MM)'),
  body('duration_hours').isInt({ min: 1, max: 4 }).withMessage('Durasi harus 1-4 jam'),
  body('customer_name').trim().notEmpty().withMessage('Nama wajib diisi'),
];

export const createBookingValidator = [
  ...bookingFields,
  body('customer_phone')
    .trim()
    .matches(PHONE_REGEX)
    .withMessage('No HP tidak valid, gunakan format 08xx atau 628xx'),
  body('payment_type').isIn(['full', 'dp']).withMessage('Tipe bayar harus full atau dp'),
];

export const walkInValidator = [
  ...bookingFields,
  body('customer_phone')
    .optional({ values: 'falsy' })
    .trim()
    .matches(PHONE_REGEX)
    .withMessage('No HP tidak valid, gunakan format 08xx atau 628xx'),
];

export const availabilityValidator = [
  query('field_id').isUUID().withMessage('Lapangan tidak valid'),
  query('date').matches(DATE_REGEX).withMessage('Tanggal tidak valid (YYYY-MM-DD)'),
];

export const listBookingsValidator = [
  query('status')
    .optional()
    .isIn(['pending_payment', 'waiting_approval', 'PAID', 'completed', 'cancelled'])
    .withMessage('Status tidak valid'),
  query('date').optional().matches(DATE_REGEX).withMessage('Tanggal tidak valid (YYYY-MM-DD)'),
  query('search').optional().trim(),
  query('page').optional().isInt({ min: 1 }).withMessage('Halaman minimal 1').toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit harus 1-100').toInt(),
];

export const bookingCodeValidator = [codeParam];

export const rejectValidator = [
  codeParam,
  body('rejection_reason').trim().notEmpty().withMessage('Alasan penolakan wajib diisi'),
];

export const cancelValidator = [
  codeParam,
  body('cancellation_reason').optional().trim(),
];

export const adminCancelValidator = [
  codeParam,
  body('cancellation_reason').trim().notEmpty().withMessage('Alasan pembatalan wajib diisi'),
];

export const completeValidator = [
  codeParam,
  body('remaining_settled').optional().isBoolean().toBoolean(),
];

export const exportBookingsValidator = [
  query('date_from')
    .optional({ values: 'falsy' })
    .matches(DATE_REGEX).withMessage('Tanggal tidak valid (YYYY-MM-DD)'),
  query('date_to')
    .optional({ values: 'falsy' })
    .matches(DATE_REGEX).withMessage('Tanggal tidak valid (YYYY-MM-DD)')
    .custom((value, { req }) => !req.query.date_from || value >= req.query.date_from)
    .withMessage('Tanggal akhir tidak boleh sebelum tanggal awal'),
  query('status')
    .optional()
    .isIn(['pending_payment', 'waiting_approval', 'PAID', 'completed', 'cancelled'])
    .withMessage('Status tidak valid'),
];
