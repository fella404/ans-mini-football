import { supabase } from '../config/supabase.js';
import { ApiError } from '../utils/ApiError.js';

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED = ['image/jpeg', 'image/png'];

// Pagar aplikasi; bucket juga punya batas ukuran sendiri.
export async function uploadImage(bucket, file, prefix) {
  if (!file) throw new ApiError(422, 'File wajib diunggah');
  if (!ALLOWED.includes(file.mimetype)) throw new ApiError(422, 'Format harus JPG atau PNG');
  if (file.size > MAX_BYTES) throw new ApiError(422, 'Ukuran file maksimal 2 MB');

  const ext = file.mimetype === 'image/png' ? 'png' : 'jpg';
  const path = `${prefix}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error } = await supabase.storage.from(bucket).upload(path, file.buffer, {
    contentType: file.mimetype,
  });
  if (error) throw new ApiError(500, `Gagal mengunggah file: ${error.message}`);

  return path;
}

export function publicUrl(bucket, path) {
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

// Untuk bucket private: URL bertanda tangan sementara (PRD 11)
export async function signedUrls(bucket, paths, expiresInSeconds = 3600) {
  if (!paths.length) return {};
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrls(paths, expiresInSeconds);
  if (error) {
    console.error('Gagal membuat URL bertanda tangan:', error.message);
    return {};
  }
  return Object.fromEntries(data.map((item) => [item.path, item.signedUrl]));
}

export async function removeObject(bucket, path) {
  // fire and forget: file lama yang gagal dihapus tidak boleh menggagalkan request
  try {
    await supabase.storage.from(bucket).remove([path]);
  } catch (err) {
    console.error('Gagal hapus file storage:', err.message);
  }
}
