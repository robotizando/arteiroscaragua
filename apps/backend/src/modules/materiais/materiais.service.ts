import { and, asc, eq, isNull, like, or, sql } from 'drizzle-orm';
import type {
  CreateMaterialInput,
  ListMateriaisQuery,
  ListMateriaisResult,
  Material,
  UpdateMaterialInput,
} from '@arteiroscaragua/shared-types';
import { db, materiais } from '../../database/client';
import { AppError } from '../../middlewares/error-handler';
import { toMaterialDTO } from './materiais.mapper';

const MAX_PAGE_SIZE = 200;

export interface ThumbnailFile {
  buffer: Buffer;
  mimeType: string;
}

export function slugify(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function findActiveById(id: string) {
  const [row] = await db
    .select()
    .from(materiais)
    .where(and(eq(materiais.id, id), isNull(materiais.deletedAt)));
  return row;
}

async function assertSlugAvailable(slug: string, ignoreId?: string) {
  const [existing] = await db.select().from(materiais).where(eq(materiais.slug, slug));
  if (existing && existing.id !== ignoreId) {
    throw new AppError('Já existe um material com este slug', 409);
  }
}

export async function listMateriais(query: ListMateriaisQuery): Promise<ListMateriaisResult> {
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, query.pageSize ?? 50));

  const conditions = [isNull(materiais.deletedAt)];
  if (query.estado) {
    conditions.push(eq(materiais.estado, query.estado));
  }
  if (query.search) {
    const term = `%${query.search.trim()}%`;
    conditions.push(or(like(materiais.nome, term), like(materiais.descricao, term))!);
  }

  const where = and(...conditions);

  const [rows, [{ count }]] = await Promise.all([
    db
      .select()
      .from(materiais)
      .where(where)
      .orderBy(asc(materiais.ordem), asc(materiais.nome))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ count: sql<number>`count(*)` }).from(materiais).where(where),
  ]);

  return {
    items: rows.map(toMaterialDTO),
    total: count,
    page,
    pageSize,
  };
}

export async function getMaterialById(id: string): Promise<Material> {
  const row = await findActiveById(id);
  if (!row) {
    throw new AppError('Material não encontrado', 404);
  }
  return toMaterialDTO(row);
}

export async function createMaterial(
  input: CreateMaterialInput,
  thumbnail?: ThumbnailFile,
): Promise<Material> {
  const slug = input.slug ?? slugify(input.nome);
  await assertSlugAvailable(slug);

  const [row] = await db
    .insert(materiais)
    .values({
      nome: input.nome,
      slug,
      descricao: input.descricao,
      imagemUrl: input.imagemUrl ?? null,
      thumbnail: thumbnail?.buffer,
      thumbnailType: thumbnail?.mimeType,
      ordem: input.ordem ?? 0,
      estado: input.estado ?? 'ativo',
    })
    .returning();

  return toMaterialDTO(row);
}

export async function updateMaterial(
  id: string,
  input: UpdateMaterialInput,
  thumbnail?: ThumbnailFile,
): Promise<Material> {
  const current = await findActiveById(id);
  if (!current) {
    throw new AppError('Material não encontrado', 404);
  }

  if (input.slug && input.slug !== current.slug) {
    await assertSlugAvailable(input.slug, id);
  }

  const [row] = await db
    .update(materiais)
    .set({
      ...(input.nome !== undefined ? { nome: input.nome } : {}),
      ...(input.slug !== undefined ? { slug: input.slug } : {}),
      ...(input.descricao !== undefined ? { descricao: input.descricao } : {}),
      ...(input.imagemUrl !== undefined ? { imagemUrl: input.imagemUrl } : {}),
      ...(input.ordem !== undefined ? { ordem: input.ordem } : {}),
      ...(input.estado !== undefined ? { estado: input.estado } : {}),
      ...(thumbnail
        ? { thumbnail: thumbnail.buffer, thumbnailType: thumbnail.mimeType }
        : input.removeThumbnail
          ? { thumbnail: null, thumbnailType: null }
          : {}),
      updatedAt: new Date(),
    })
    .where(eq(materiais.id, id))
    .returning();

  return toMaterialDTO(row);
}

export async function getMaterialThumbnail(id: string): Promise<ThumbnailFile | null> {
  const row = await findActiveById(id);
  if (!row || !row.thumbnail || !row.thumbnailType) {
    return null;
  }
  return { buffer: row.thumbnail, mimeType: row.thumbnailType };
}

export async function deleteMaterial(id: string): Promise<void> {
  const current = await findActiveById(id);
  if (!current) {
    throw new AppError('Material não encontrado', 404);
  }

  await db
    .update(materiais)
    .set({ deletedAt: new Date(), estado: 'desativado', updatedAt: new Date() })
    .where(eq(materiais.id, id));
}
