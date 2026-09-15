import { config as loadEnv } from 'dotenv';

loadEnv({ path: '.env.local' });

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  port: Number(process.env.PORT || 4001),
  backendUrl: process.env.BACKEND_URL || 'http://localhost:4001',
  adminUrl: process.env.ADMIN_URL || 'http://localhost:4002',
  // Site público (frontend): links dos e-mails e redirects do login com Google.
  siteUrl: process.env.SITE_URL || 'http://localhost:4003',
  database: {
    url: process.env.DATABASE_URL || './data/dev.sqlite',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-troque-em-producao',
    expiresIn: process.env.JWT_EXPIRES_IN || '10m',
  },
  // Sessão dos usuários do site: segredo próprio, para um token nunca valer na Admin (e vice-versa).
  usuarioJwt: {
    secret: process.env.USER_JWT_SECRET || 'dev-user-secret-troque-em-producao',
    expiresIn: process.env.USER_JWT_EXPIRES_IN || '7d',
  },
  email: {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.EMAIL_FROM || 'Arteiros Caragua <nao-responda@arteiroscaragua.com.br>',
  },
  // Custo do bcrypt para senhas de usuários (nunca abaixo de 10).
  bcryptCost: Math.max(10, Number(process.env.BCRYPT_COST || 12)),
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

export function isEmailConfigured(): boolean {
  return Boolean(config.email.host);
}
