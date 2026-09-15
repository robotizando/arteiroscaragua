import { Router, Request, Response, NextFunction } from 'express';
import passport from '../../config/passport';
import type { AdminUserRow } from '../../database/client';
import { isGoogleOAuthConfigured } from '../../config';
import { AppError, asyncHandler } from '../../middlewares/error-handler';
import { requireAdminAuth } from '../../middlewares/require-admin-auth';
import { registrarAcesso } from '../acessos/acessos.service';
import { googleCallbackSuccess, redirectLoginError, me, logout } from './auth.controller';

const router = Router();

function ensureGoogleConfigured(_req: Request, _res: Response, next: NextFunction) {
  if (!isGoogleOAuthConfigured()) {
    throw new AppError('Login com Google não está configurado no servidor', 503);
  }
  next();
}

router.get(
  '/google',
  ensureGoogleConfigured,
  passport.authenticate('google', { scope: ['profile', 'email'], session: false }),
);

router.get('/google/callback', ensureGoogleConfigured, (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate(
    'google',
    { session: false },
    (err: Error | null, adminUser: AdminUserRow | false, info?: { message?: string; email?: string }) => {
      if (err) {
        return registrarAcesso(req, { ator: 'admin', metodo: 'google', sucesso: false, motivo: 'auth_failed' }).then(
          () => next(err),
        );
      }

      if (!adminUser) {
        const motivo = info?.message || 'not_authorized';
        return registrarAcesso(req, {
          ator: 'admin',
          metodo: 'google',
          sucesso: false,
          motivo,
          email: info?.email,
        }).then(() => redirectLoginError(res, motivo));
      }

      req.user = adminUser;
      return registrarAcesso(req, {
        ator: 'admin',
        metodo: 'google',
        sucesso: true,
        email: adminUser.email,
        adminUserId: adminUser.id,
      }).then(() => googleCallbackSuccess(req, res));
    },
  )(req, res, next);
});

router.get('/me', requireAdminAuth, asyncHandler(async (req, res) => me(req, res)));
router.post('/logout', requireAdminAuth, asyncHandler(async (req, res) => logout(req, res)));

export default router;
