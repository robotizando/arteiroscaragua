import type { Request } from 'express';
import { and, desc, eq, like, sql } from 'drizzle-orm';
import type {
  AcessoAtor,
  AcessoMetodo,
  ListAcessosQuery,
  ListAcessosResult,
} from '@arteiroscaragua/shared-types';
import { db, acessosLog } from '../../database/client';
import { toAcessoLogDTO } from './acessos.mapper';

const MAX_PAGE_SIZE = 200;

export interface RegistrarAcessoInput {
  ator: AcessoAtor;
  metodo: AcessoMetodo;
  sucesso: boolean;
  motivo?: string | null;
  email?: string | null;
  adminUserId?: string | null;
  usuarioId?: string | null;
}

// Registra um login ou tentativa de login. Nunca deve derrubar o fluxo de
// autenticação: falhas ao gravar o log são apenas reportadas no console.
export async function registrarAcesso(req: Request, input: RegistrarAcessoInput): Promise<void> {
  try {
    await db.insert(acessosLog).values({
      ator: input.ator,
      metodo: input.metodo,
      sucesso: input.sucesso,
      motivo: input.motivo ?? null,
      email: input.email?.toLowerCase() ?? null,
      adminUserId: input.adminUserId ?? null,
      usuarioId: input.usuarioId ?? null,
      ip: req.ip ?? null,
      userAgent: req.get('user-agent')?.slice(0, 500) ?? null,
    });
  } catch (error) {
    console.error('[ACESSOS] Falha ao registrar acesso:', error);
  }
}

export async function listAcessos(query: ListAcessosQuery): Promise<ListAcessosResult> {
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, query.pageSize ?? 50));

  const conditions = [];
  if (query.ator) conditions.push(eq(acessosLog.ator, query.ator));
  if (query.usuarioId) conditions.push(eq(acessosLog.usuarioId, query.usuarioId));
  if (query.adminUserId) conditions.push(eq(acessosLog.adminUserId, query.adminUserId));
  if (query.sucesso !== undefined) conditions.push(eq(acessosLog.sucesso, query.sucesso));
  if (query.email) conditions.push(like(acessosLog.email, `%${query.email.trim().toLowerCase()}%`));

  const where = conditions.length ? and(...conditions) : undefined;

  const [rows, [{ count }]] = await Promise.all([
    db
      .select()
      .from(acessosLog)
      .where(where)
      .orderBy(desc(acessosLog.createdAt), desc(acessosLog.id))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ count: sql<number>`count(*)` }).from(acessosLog).where(where),
  ]);

  return {
    items: rows.map(toAcessoLogDTO),
    total: count,
    page,
    pageSize,
  };
}
