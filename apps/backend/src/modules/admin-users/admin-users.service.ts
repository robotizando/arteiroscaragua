import { and, desc, eq, isNull, like, ne, or, sql } from 'drizzle-orm';
import type {
  AdminUser,
  CreateAdminUserInput,
  ListAdminUsersQuery,
  ListAdminUsersResult,
  UpdateAdminUserInput,
} from '@arteiroscaragua/shared-types';
import { db, adminUsers } from '../../database/client';
import { AppError } from '../../middlewares/error-handler';
import { toAdminUserDTO } from './admin-users.mapper';

const MAX_PAGE_SIZE = 100;

async function assertNotLastActiveAdmin(idBeingChanged: string) {
  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(adminUsers)
    .where(
      and(
        eq(adminUsers.estado, 'ativo'),
        isNull(adminUsers.deletedAt),
        ne(adminUsers.id, idBeingChanged),
      ),
    );

  if (!row || row.count === 0) {
    throw new AppError(
      'Não é possível desativar ou excluir o último administrador ativo',
      400,
    );
  }
}

async function findActiveById(id: string) {
  const [row] = await db
    .select()
    .from(adminUsers)
    .where(and(eq(adminUsers.id, id), isNull(adminUsers.deletedAt)));
  return row;
}

async function assertEmailAvailable(email: string, ignoreId?: string) {
  const [existing] = await db.select().from(adminUsers).where(eq(adminUsers.email, email));
  if (existing && existing.id !== ignoreId) {
    throw new AppError('Já existe um administrador com este e-mail', 409);
  }
}

export async function listAdminUsers(query: ListAdminUsersQuery): Promise<ListAdminUsersResult> {
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, query.pageSize ?? 20));

  const conditions = [isNull(adminUsers.deletedAt)];
  if (query.estado) {
    conditions.push(eq(adminUsers.estado, query.estado));
  }
  if (query.search) {
    const term = `%${query.search.trim()}%`;
    conditions.push(
      or(like(adminUsers.nome, term), like(adminUsers.email, term))!,
    );
  }

  const where = and(...conditions);

  const [rows, [{ count }]] = await Promise.all([
    db
      .select()
      .from(adminUsers)
      .where(where)
      .orderBy(desc(adminUsers.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ count: sql<number>`count(*)` }).from(adminUsers).where(where),
  ]);

  return {
    items: rows.map(toAdminUserDTO),
    total: count,
    page,
    pageSize,
  };
}

export async function getAdminUserById(id: string): Promise<AdminUser> {
  const row = await findActiveById(id);
  if (!row) {
    throw new AppError('Administrador não encontrado', 404);
  }
  return toAdminUserDTO(row);
}

export async function createAdminUser(input: CreateAdminUserInput): Promise<AdminUser> {
  await assertEmailAvailable(input.email);

  const [row] = await db
    .insert(adminUsers)
    .values({
      email: input.email,
      nome: input.nome,
      telefone: input.telefone ?? null,
      estado: input.estado ?? 'ativo',
    })
    .returning();

  return toAdminUserDTO(row);
}

export async function updateAdminUser(id: string, input: UpdateAdminUserInput): Promise<AdminUser> {
  const current = await findActiveById(id);
  if (!current) {
    throw new AppError('Administrador não encontrado', 404);
  }

  if (input.email && input.email !== current.email) {
    await assertEmailAvailable(input.email, id);
  }

  if (input.estado === 'desativado' && current.estado === 'ativo') {
    await assertNotLastActiveAdmin(id);
  }

  const [row] = await db
    .update(adminUsers)
    .set({
      ...(input.email !== undefined ? { email: input.email } : {}),
      ...(input.nome !== undefined ? { nome: input.nome } : {}),
      ...(input.telefone !== undefined ? { telefone: input.telefone } : {}),
      ...(input.estado !== undefined ? { estado: input.estado } : {}),
      updatedAt: new Date(),
    })
    .where(eq(adminUsers.id, id))
    .returning();

  return toAdminUserDTO(row);
}

export async function deleteAdminUser(id: string): Promise<void> {
  const current = await findActiveById(id);
  if (!current) {
    throw new AppError('Administrador não encontrado', 404);
  }

  if (current.estado === 'ativo') {
    await assertNotLastActiveAdmin(id);
  }

  await db
    .update(adminUsers)
    .set({ deletedAt: new Date(), estado: 'desativado', updatedAt: new Date() })
    .where(eq(adminUsers.id, id));
}
