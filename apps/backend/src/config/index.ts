import { config as loadEnv } from 'dotenv';

loadEnv({ path: '.env.local' });

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  port: Number(process.env.PORT || 4001),
  backendUrl: process.env.BACKEND_URL || 'http://localhost:4001',
  adminUrl: process.env.ADMIN_URL || 'http://localhost:4002',
  database: {
    url: process.env.DATABASE_URL || './data/dev.sqlite',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-troque-em-producao',
    expiresIn: process.env.JWT_EXPIRES_IN || '10m',
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  },
  defaultAdmin: {
    email: process.env.DEFAULT_ADMIN_EMAIL || 'robotizando.brasil@gmail.com',
    nome: process.env.DEFAULT_ADMIN_NOME || 'Administrador',
  },
};

export function isGoogleOAuthConfigured(): boolean {
  return Boolean(config.google.clientId && config.google.clientSecret);
}
