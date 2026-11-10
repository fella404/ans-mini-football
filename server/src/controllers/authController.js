import * as authService from '../services/authService.js';
import { authCookie, COOKIE_NAME } from '../lib/token.js';

export async function login(req, res) {
  const { email, password } = req.body;
  const { token, user } = await authService.login(email, password);

  res.cookie(COOKIE_NAME, token, authCookie(token));
  res.json({ success: true, data: user, message: 'Login berhasil' });
}

export function logout(req, res) {
  res.clearCookie(COOKIE_NAME, { path: '/' });
  res.json({ success: true, data: null, message: 'Logout berhasil' });
}

export function me(req, res) {
  res.json({ success: true, data: req.user, message: 'OK' });
}

export async function changePassword(req, res) {
  const { oldPassword, newPassword } = req.body;
  await authService.changePassword(req.user.id, oldPassword, newPassword);
  res.json({ success: true, data: null, message: 'Password berhasil diubah' });
}
