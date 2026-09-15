import { Request, Response, NextFunction } from 'express';
import { and, eq, isNull } from 'drizzle-orm';
import { db, adminUsers, type AdminUserRow } from '../database/client';
import { verifyAdminToken } from '../modules/auth/jwt';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      adminUser?: AdminUserRow;
    }
  }
}

export async function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;

    if (!token) {
      return res.status(401).json({ error: 'Token não informado' });
    }

    const payload = verifyAdminToken(token);

    const [adminUser] = await db
      .select()
      .from(adminUsers)
      .where(and(eq(adminUsers.id, payload.sub), isNull(adminUsers.deletedAt)));

    if (!adminUser || adminUser.estado !== 'ativo') {
      return res.status(401).json({ error: 'Sessão inválida' });
    }

    req.adminUser = adminUser;
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
}
