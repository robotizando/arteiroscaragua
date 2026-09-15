import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import passport from './config/passport';
import { config } from './config';
import { errorHandler } from './middlewares/error-handler';
import authRoutes from './modules/auth/auth.routes';
import adminUsersRoutes from './modules/admin-users/admin-users.routes';
import materiaisRoutes from './modules/materiais/materiais.routes';
import arteirosRoutes from './modules/arteiros/arteiros.routes';
import usuariosRoutes from './modules/usuarios/usuarios.routes';
import acessosRoutes from './modules/acessos/acessos.routes';
import configuracoesSiteRoutes from './modules/configuracoes-site/configuracoes-site.routes';
import contaRoutes from './modules/conta/conta.routes';
import publicoRoutes from './modules/publico/publico.routes';

const app = express();

// Atrás de proxy reverso em produção: o IP do cliente (log de acesso e rate limit) vem do X-Forwarded-For.
if (config.isProduction) {
  app.set('trust proxy', 1);
}

// As imagens (logotipos, peças, thumbnails) são carregadas via <img> pelo admin e pelo site,
// que rodam em outras origens; o padrão do helmet (same-origin) faria o navegador bloqueá-las.
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(
  cors({
    origin: [config.adminUrl, config.siteUrl],
  }),
);
app.use(express.json());
app.use(passport.initialize());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/api/auth', authRoutes);
app.use('/api/admin-users', adminUsersRoutes);
app.use('/api/materiais', materiaisRoutes);
app.use('/api/arteiros', arteirosRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/acessos', acessosRoutes);
app.use('/api/configuracoes-site', configuracoesSiteRoutes);
app.use('/api/conta', contaRoutes);
app.use('/api/publico', publicoRoutes);

app.use(errorHandler);

export default app;
