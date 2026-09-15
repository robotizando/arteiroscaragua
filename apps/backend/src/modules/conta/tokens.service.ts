import { createHash, randomBytes } from 'crypto';
import { and, eq, isNull } from 'drizzle-orm';
import type { UsuarioTokenTipo } from '@arteiroscaragua/shared-types';
import { db, usuarioTokens } from '../../database/client';

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

// Gera um token de uso único e invalida os anteriores do mesmo tipo para o usuário.
// Devolve o token em claro (para o link do e-mail); o banco guarda só o hash.
export function gerarToken(usuarioId: string, tipo: UsuarioTokenTipo, validadeMs: number): string {
  const token = randomBytes(32).toString('base64url');
  const agora = new Date();

  db.transaction((tx) => {
    tx.update(usuarioTokens)
      .set({ usadoEm: agora })
      .where(and(eq(usuarioTokens.usuarioId, usuarioId), eq(usuarioTokens.tipo, tipo), isNull(usuarioTokens.usadoEm)))
      .run();
    tx.insert(usuarioTokens)
      .values({
        usuarioId,
        tipo,
        tokenHash: hashToken(token),
        expiraEm: new Date(agora.getTime() + validadeMs),
      })
      .run();
  });

  return token;
}

// Consome o token se ele existir, for do tipo esperado, não tiver sido usado e não tiver expirado.
// Devolve o id do usuário dono do token, ou null.
export function consumirToken(token: string, tipo: UsuarioTokenTipo): string | null {
  const agora = new Date();

  return db.transaction((tx) => {
    const row = tx
      .select()
      .from(usuarioTokens)
      .where(and(eq(usuarioTokens.tokenHash, hashToken(token)), eq(usuarioTokens.tipo, tipo)))
      .get();

    if (!row || row.usadoEm || row.expiraEm.getTime() <= agora.getTime()) {
      return null;
    }

    tx.update(usuarioTokens).set({ usadoEm: agora }).where(eq(usuarioTokens.id, row.id)).run();
    return row.usuarioId;
  });
}
