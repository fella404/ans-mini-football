import { query } from 'express-validator';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const scheduleQueryValidator = [
  query('date').optional().matches(DATE_REGEX).withMessage('Tanggal tidak valid (YYYY-MM-DD)'),
];
