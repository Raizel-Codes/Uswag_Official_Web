import 'dotenv/config';

// Central place to read and validate environment variables.
// Fail loudly at boot if a required secret is missing — don't let
// undefined secrets silently reach jwt.sign() or the HMAC signer.
function required(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
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

  facebook: {
    pageId: process.env.FACEBOOK_PAGE_ID ?? '',
    pageAccessToken: process.env.FACEBOOK_PAGE_ACCESS_TOKEN ?? '',
  },

  vapid: {
    publicKey: required('VAPID_PUBLIC_KEY'),
    privateKey: required('VAPID_PRIVATE_KEY'),
    subject: process.env.VAPID_SUBJECT ?? 'mailto:uswag@nwssu.edu.ph',
  },
};
