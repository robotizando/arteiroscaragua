import { and, eq, isNull } from 'drizzle-orm';
import { arteiros, db, usuarioArteiros } from '../../database/client';

// Perfil de arteiro vinculado ao usuário (hoje no máximo um, ver USUARIO_MAX_ARTEIROS).
export async function arteiroIdDoUsuario(usuarioId: string): Promise<number | null> {
  const [row] = await db
    .select({ id: arteiros.id })
    .from(usuarioArteiros)
    .innerJoin(arteiros, eq(arteiros.id, usuarioArteiros.arteiroId))
    .where(and(eq(usuarioArteiros.usuarioId, usuarioId), isNull(arteiros.deletedAt)));
  return row?.id ?? null;
}

export async function usuarioPossuiArteiro(usuarioId: string, arteiroId: number): Promise<boolean> {
  return (await arteiroIdDoUsuario(usuarioId)) === arteiroId;
}
