import { Request, Response, NextFunction } from 'express';
import { and, eq, isNull } from 'drizzle-orm';
import { db, usuarios, type UsuarioRow } from '../database/client';
import { verifyUsuarioToken } from '../modules/conta/jwt';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      usuario?: UsuarioRow;
    }
  }
}

// Sessão do usuário do site (arteiros). O usuário é recarregado a cada requisição para que
// bloqueio, exclusão e troca de senha valham na hora.
export async function requireUsuarioAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;

    if (!token) {
      return res.status(401).json({ error: 'Token não informado' });
    }

    const payload = verifyUsuarioToken(token);

    const [usuario] = await db
      .select()
      .from(usuarios)
      .where(and(eq(usuarios.id, payload.sub), isNull(usuarios.deletedAt)));

    if (!usuario || usuario.estado !== 'ativo') {
      return res.status(401).json({ error: 'Sessão inválida' });
    }

    // senha_alterada_em é gravado em segundos, como o iat do JWT.
    if (usuario.senhaAlteradaEm && Math.floor(usuario.senhaAlteradaEm.getTime() / 1000) > payload.iat) {
      return res.status(401).json({ error: 'Sessão expirada' });
    }

    req.usuario = usuario;
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
}
