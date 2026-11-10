import 'dotenv/config';

const REQUIRED = ['DATABASE_URL', 'JWT_SECRET'];
const missing = REQUIRED.filter((key) => !process.env[key]);

if (missing.length) {
  console.error(`Env belum diisi: ${missing.join(', ')} (copy .env.example ke .env)`);
  process.exit(1);
}

export const config = {
  port: Number(process.env.PORT ?? 3000),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '24h',
  corsOrigin: (process.env.CORS_ORIGIN ?? 'http://localhost:5173,http://localhost:5174')
    .split(',')
    .map((origin) => origin.trim()),
  appUrl: process.env.APP_URL ?? 'http://localhost:5173',
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  supabaseBucketProof: process.env.SUPABASE_BUCKET_PROOF ?? 'booking-proofs',
  supabaseBucketPublic: process.env.SUPABASE_BUCKET_PUBLIC ?? 'public-assets',
  fonnteToken: process.env.FONNTE_TOKEN,
};
