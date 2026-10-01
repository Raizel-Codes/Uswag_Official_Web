import 'dotenv/config';

// Central place to read and validate environment variables.
// Fail loudly at boot if a required secret is missing — don't let
// undefined secrets silently reach jwt.sign() or the HMAC signer.
function required(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

// A 32-byte key, base64-encoded (generate: `openssl rand -base64 32`).
function requiredKey(key: string): Buffer {
  const buf = Buffer.from(required(key), 'base64');
  if (buf.length !== 32) throw new Error(`${key} must be 32 random bytes, base64-encoded`);
  return buf;
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  frontendOrigin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173',

  databaseUrl: required('DATABASE_URL'),

  jwt: {
    accessSecret: required('JWT_ACCESS_SECRET'),
    refreshSecret: required('JWT_REFRESH_SECRET'),
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  },

  qrSigningSecret: required('QR_SIGNING_SECRET'),

  // Student ID protection (utils/crypto.ts). Two separate keys, 32 random
  // bytes each, base64. Losing HASH_KEY breaks duplicate detection for every
  // stored ID; losing ENC_KEY makes pending applications' IDs unreadable.
  studentId: {
    hashKey: requiredKey('STUDENT_ID_HASH_KEY'),
    encKey: requiredKey('STUDENT_ID_ENC_KEY'),
  },

  facebook: {
    pageId: process.env.FACEBOOK_PAGE_ID ?? '',
    pageAccessToken: process.env.FACEBOOK_PAGE_ACCESS_TOKEN ?? '',
  },

  // Outbound email (password-reset links). Optional: without both of these nothing is emailed and the
  // server says so in its log. See backend/.env.example.
  email: {
    apiKey: process.env.RESEND_API_KEY ?? '',
    from: process.env.EMAIL_FROM ?? '',
    apiUrl: (process.env.RESEND_API_URL ?? 'https://api.resend.com').replace(/\/+$/, ''),
  },

  vapid: {
    publicKey: required('VAPID_PUBLIC_KEY'),
    privateKey: required('VAPID_PRIVATE_KEY'),
    subject: process.env.VAPID_SUBJECT ?? 'mailto:uswag@nwssu.edu.ph',
  },
};
