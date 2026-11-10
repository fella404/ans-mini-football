import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

export const COOKIE_NAME = 'token';

export function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
}

export function authCookie(token) {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.nodeEnv === 'production',
    path: '/',
    maxAge: jwt.decode(token).exp * 1000 - Date.now(),
  };
}
