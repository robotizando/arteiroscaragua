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

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: config.adminUrl,
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

app.use(errorHandler);

export default app;
