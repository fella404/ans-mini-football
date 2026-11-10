import { validationResult } from 'express-validator';
import { ApiError } from '../utils/ApiError.js';

export function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();

  const data = errors.array().map((err) => ({ field: err.path, message: err.msg }));
  throw new ApiError(422, data[0].message, data);
}
