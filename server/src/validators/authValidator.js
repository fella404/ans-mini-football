import { body } from 'express-validator';

export const loginValidator = [
  body('email').trim().toLowerCase().isEmail().withMessage('Email tidak valid'),
  body('password').isString().notEmpty().withMessage('Password wajib diisi'),
];

export const changePasswordValidator = [
  body('oldPassword').isString().notEmpty().withMessage('Password lama wajib diisi'),
  body('newPassword').isLength({ min: 8 }).withMessage('Password baru minimal 8 karakter'),
  body('confirmPassword')
    .custom((value, { req }) => value === req.body.newPassword)
    .withMessage('Konfirmasi password tidak sama'),
];
