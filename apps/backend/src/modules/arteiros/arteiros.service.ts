import { and, asc, eq, inArray, isNull, like, or, sql } from 'drizzle-orm';
import type {
  Arteiro,
  ArteiroSummary,
  CreateArteiroInput,
  ListArteirosQuery,
  ListArteirosResult,
  SetArteiroMateriaisInput,
  UpdateArteiroInput,
} from '@arteiroscaragua/shared-types';
import {
  db,
  arteiros,
  arteiroMateriais,
  arteiroCursos,
  arteiroEventos,
  arteiroPecaImagens,
  arteiroPecas,
  arteiroPremios,
  arteiroProjetos,
  arteiroVideos,
  materiais,
} from '../../database/client';
import { AppError } from '../../middlewares/error-handler';
import { toArteiroDTO, toArteiroPecaDTO, toArteiroSummaryDTO } from './arteiros.mapper';

const MAX_PAGE_SIZE = 200;

export interface LogotipoFile {
  buffer: Buffer;
  mimeType: string;
}

async function findActiveById(id: number) {
  const [row] = await db
    .select()
    .from(arteiros)
    .where(and(eq(arteiros.id, id), isNull(arteiros.deletedAt)));
  return row;
}

export async function listArteiros(query: ListArteirosQuery): Promise<ListArteirosResult> {
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, query.pageSize ?? 50));

  const conditions = [isNull(arteiros.deletedAt)];
  if (query.estado) {
    conditions.push(eq(arteiros.estado, query.estado));
  }
  if (query.search) {
    const term = `%${query.search.trim()}%`;
    conditions.push(or(like(arteiros.nome, term), like(arteiros.grupo, term), like(arteiros.sicab, term))!);
  }

  const where = and(...conditions);

  const [rows, [{ count }]] = await Promise.all([
    db.select().from(arteiros).where(where).orderBy(asc(arteiros.nome)).limit(pageSize).offset((page - 1) * pageSize),
    db.select({ count: sql<number>`count(*)` }).from(arteiros).where(where),
  ]);

  return {
    items: rows.map(toArteiroSummaryDTO),
    total: count,
    page,
    pageSize,
  };
}

export async function getArteiroById(id: number): Promise<Arteiro> {
  const row = await findActiveById(id);
  if (!row) {
    throw new AppError('Arteiro não encontrado', 404);
  }

  const [materiaisRows, pecaRows, premioRows, videoRows, eventoRows, cursoRows, projetoRows] = await Promise.all([
    db
      .select({ id: materiais.id, nome: materiais.nome })
      .from(arteiroMateriais)
      .innerJoin(materiais, eq(materiais.id, arteiroMateriais.materialId))
      .where(eq(arteiroMateriais.arteiroId, id)),
    db.select().from(arteiroPecas).where(eq(arteiroPecas.arteiroId, id)).orderBy(asc(arteiroPecas.createdAt)),
    db.select().from(arteiroPremios).where(eq(arteiroPremios.arteiroId, id)).orderBy(asc(arteiroPremios.ano)),
    db.select().from(arteiroVideos).where(eq(arteiroVideos.arteiroId, id)).orderBy(asc(arteiroVideos.id)),
    db.select().from(arteiroEventos).where(eq(arteiroEventos.arteiroId, id)).orderBy(asc(arteiroEventos.mesAno)),
    db.select().from(arteiroCursos).where(eq(arteiroCursos.arteiroId, id)).orderBy(asc(arteiroCursos.id)),
    db.select().from(arteiroProjetos).where(eq(arteiroProjetos.arteiroId, id)).orderBy(asc(arteiroProjetos.id)),
  ]);

  const pecaIds = pecaRows.map((peca) => peca.id);
  const imagensRows = pecaIds.length
    ? await db
        .select()
        .from(arteiroPecaImagens)
        .where(inArray(arteiroPecaImagens.pecaId, pecaIds))
        .orderBy(asc(arteiroPecaImagens.ordem))
    : [];

  const pecas = pecaRows.map((peca) =>
    toArteiroPecaDTO(
      peca,
      imagensRows.filter((imagem) => imagem.pecaId === peca.id),
    ),
  );

  return toArteiroDTO(row, {
    materiais: materiaisRows,
    pecas,
    premios: premioRows,
    videos: videoRows,
    eventos: eventoRows,
    cursos: cursoRows,
    projetos: projetoRows,
  });
}

export async function createArteiro(input: CreateArteiroInput, logotipo?: LogotipoFile): Promise<ArteiroSummary> {
  const [row] = await db
    .insert(arteiros)
    .values({
      nome: input.nome,
      telefone: input.telefone ?? null,
      sicab: input.sicab ?? null,
      grupo: input.grupo ?? null,
      arroba: input.arroba ?? null,
      redesSociais: input.redesSociais ?? null,
      biografia: input.biografia ?? null,
      logotipo: logotipo?.buffer,
      logotipoType: logotipo?.mimeType,
      estado: input.estado ?? 'ativo',
    })
    .returning();

  return toArteiroSummaryDTO(row);
}

export async function updateArteiro(
  id: number,
  input: UpdateArteiroInput,
  logotipo?: LogotipoFile,
): Promise<ArteiroSummary> {
  const current = await findActiveById(id);
  if (!current) {
    throw new AppError('Arteiro não encontrado', 404);
  }

  const [row] = await db
    .update(arteiros)
    .set({
      ...(input.nome !== undefined ? { nome: input.nome } : {}),
      ...(input.telefone !== undefined ? { telefone: input.telefone } : {}),
      ...(input.sicab !== undefined ? { sicab: input.sicab } : {}),
      ...(input.grupo !== undefined ? { grupo: input.grupo } : {}),
      ...(input.arroba !== undefined ? { arroba: input.arroba } : {}),
      ...(input.redesSociais !== undefined ? { redesSociais: input.redesSociais } : {}),
      ...(input.biografia !== undefined ? { biografia: input.biografia } : {}),
      ...(input.estado !== undefined ? { estado: input.estado } : {}),
      ...(logotipo
        ? { logotipo: logotipo.buffer, logotipoType: logotipo.mimeType }
        : input.removeLogotipo
          ? { logotipo: null, logotipoType: null }
          : {}),
      updatedAt: new Date(),
    })
    .where(eq(arteiros.id, id))
    .returning();

  return toArteiroSummaryDTO(row);
}

export async function getArteiroLogotipo(id: number): Promise<LogotipoFile | null> {
  const row = await findActiveById(id);
  if (!row || !row.logotipo || !row.logotipoType) {
    return null;
  }
  return { buffer: row.logotipo, mimeType: row.logotipoType };
}

export async function deleteArteiro(id: number): Promise<void> {
  const current = await findActiveById(id);
  if (!current) {
    throw new AppError('Arteiro não encontrado', 404);
  }

  await db
    .update(arteiros)
    .set({ deletedAt: new Date(), estado: 'inativo', updatedAt: new Date() })
    .where(eq(arteiros.id, id));
}

export async function setArteiroMateriais(id: number, input: SetArteiroMateriaisInput): Promise<void> {
  const current = await findActiveById(id);
  if (!current) {
    throw new AppError('Arteiro não encontrado', 404);
  }

  const uniqueIds = Array.from(new Set(input.materialIds));

  if (uniqueIds.length) {
    const existing = await db.select({ id: materiais.id }).from(materiais).where(inArray(materiais.id, uniqueIds));
    if (existing.length !== uniqueIds.length) {
      throw new AppError('Um ou mais materiais informados não existem', 400);
    }
  }

  db.transaction((tx) => {
    tx.delete(arteiroMateriais).where(eq(arteiroMateriais.arteiroId, id)).run();
    if (uniqueIds.length) {
      tx.insert(arteiroMateriais)
        .values(uniqueIds.map((materialId) => ({ arteiroId: id, materialId })))
        .run();
    }
  });
}
