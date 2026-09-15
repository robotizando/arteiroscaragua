import { Request, Response } from 'express';
import type { AdminUserRow } from '../../database/client';
import { config } from '../../config';
import { signAdminToken } from './jwt';
import { toAdminUserDTO } from '../admin-users/admin-users.mapper';

export function googleCallbackSuccess(req: Request, res: Response) {
  const adminUser = req.user as AdminUserRow;

  const token = signAdminToken({ sub: adminUser.id, email: adminUser.email });

  const redirectUrl = new URL('/auth/callback', config.adminUrl);
  redirectUrl.searchParams.set('token', token);

  res.redirect(redirectUrl.toString());
}

export function redirectLoginError(res: Response, message: string) {
  const redirectUrl = new URL('/login', config.adminUrl);
  redirectUrl.searchParams.set('error', message);
  res.redirect(redirectUrl.toString());
}

export function me(req: Request, res: Response) {
  const adminUser = req.adminUser as AdminUserRow;
  res.json({ admin: toAdminUserDTO(adminUser) });
}

export function logout(_req: Request, res: Response) {
  res.status(200).json({ ok: true });
}
