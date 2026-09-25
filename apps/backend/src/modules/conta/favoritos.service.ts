import { and, desc, eq, isNull } from 'drizzle-orm';
import type { PublicoPecaResumo } from '@arteiroscaragua/shared-types';
import { arteiroPecas, arteiros, db, usuarioFavoritos } from '../../database/client';
import { AppError } from '../../middlewares/error-handler';
import { listPecasPorIds } from '../publico/publico.service';

async function listarIdsOrdenados(usuarioId: string): Promise<number[]> {
  const rows = await db
    .select({ pecaId: usuarioFavoritos.pecaId })
    .from(usuarioFavoritos)
    .where(eq(usuarioFavoritos.usuarioId, usuarioId))
    .orderBy(desc(usuarioFavoritos.createdAt), desc(usuarioFavoritos.pecaId));
  return rows.map((row) => row.pecaId);
}

export async function listarIds(usuarioId: string): Promise<number[]> {
  return listarIdsOrdenados(usuarioId);
}

export async function listar(usuarioId: string): Promise<PublicoPecaResumo[]> {
  return listPecasPorIds(await listarIdsOrdenados(usuarioId));
}

export async function adicionar(usuarioId: string, pecaId: number): Promise<void> {
  // Só peças visíveis no site podem ser favoritadas.
  const [peca] = await db
    .select({ id: arteiroPecas.id })
    .from(arteiroPecas)
    .innerJoin(arteiros, eq(arteiros.id, arteiroPecas.arteiroId))
    .where(and(eq(arteiroPecas.id, pecaId), eq(arteiros.estado, 'ativo'), isNull(arteiros.deletedAt)));
  if (!peca) {
    throw new AppError('Peça não encontrada', 404);
  }

  // Favoritar duas vezes não é erro: a chave primária (usuário, peça) resolve.
  await db.insert(usuarioFavoritos).values({ usuarioId, pecaId }).onConflictDoNothing();
}

export async function remover(usuarioId: string, pecaId: number): Promise<void> {
  await db
    .delete(usuarioFavoritos)
    .where(and(eq(usuarioFavoritos.usuarioId, usuarioId), eq(usuarioFavoritos.pecaId, pecaId)));
}
