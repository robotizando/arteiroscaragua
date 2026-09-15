import { Router, Request, Response, NextFunction } from 'express';
import passport from '../../config/passport';
import type { AdminUserRow } from '../../database/client';
import { isGoogleOAuthConfigured } from '../../config';
import { AppError, asyncHandler } from '../../middlewares/error-handler';
import { requireAdminAuth } from '../../middlewares/require-admin-auth';
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
    (err: Error | null, adminUser: AdminUserRow | false, info?: { message?: string }) => {
      if (err) return next(err);
      if (!adminUser) return redirectLoginError(res, info?.message || 'not_authorized');

      req.user = adminUser;
      return googleCallbackSuccess(req, res);
    },
  )(req, res, next);
});

router.get('/me', requireAdminAuth, asyncHandler(async (req, res) => me(req, res)));
router.post('/logout', requireAdminAuth, asyncHandler(async (req, res) => logout(req, res)));

export default router;
