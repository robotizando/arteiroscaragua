import { and, asc, eq, inArray, isNull, max } from 'drizzle-orm';
import type {
  ArteiroMaterialRef,
  ArteiroPeca,
  CreateArteiroPecaInput,
  UpdateArteiroPecaInput,
} from '@arteiroscaragua/shared-types';
import { db, arteiroPecaImagens, arteiroPecaMateriais, arteiroPecas, arteiros, materiais } from '../../database/client';
import { AppError } from '../../middlewares/error-handler';
import { toArteiroPecaDTO } from './arteiros.mapper';

export interface ImagemFile {
  buffer: Buffer;
  mimeType: string;
}

async function assertArteiroExists(arteiroId: number) {
  const [arteiro] = await db
    .select({ id: arteiros.id })
    .from(arteiros)
    .where(and(eq(arteiros.id, arteiroId), isNull(arteiros.deletedAt)));
  if (!arteiro) {
    throw new AppError('Arteiro não encontrado', 404);
  }
}

async function findPeca(arteiroId: number, pecaId: number) {
  const [row] = await db
    .select()
    .from(arteiroPecas)
    .where(and(eq(arteiroPecas.id, pecaId), eq(arteiroPecas.arteiroId, arteiroId)));
  return row;
}

async function loadImagens(pecaId: number) {
  return db.select().from(arteiroPecaImagens).where(eq(arteiroPecaImagens.pecaId, pecaId)).orderBy(asc(arteiroPecaImagens.ordem));
}

// Materiais das peças, agrupados por peça. Materiais excluídos nunca aparecem; os desativados
// continuam visíveis na Admin e somem do site (apenasAtivos).
export async function loadPecaMateriais(
  pecaIds: number[],
  { apenasAtivos = false }: { apenasAtivos?: boolean } = {},
): Promise<Map<number, ArteiroMaterialRef[]>> {
  const result = new Map<number, ArteiroMaterialRef[]>();
  if (!pecaIds.length) return result;

  const conditions = [inArray(arteiroPecaMateriais.pecaId, pecaIds), isNull(materiais.deletedAt)];
  if (apenasAtivos) conditions.push(eq(materiais.estado, 'ativo'));

  const rows = await db
    .select({ pecaId: arteiroPecaMateriais.pecaId, id: materiais.id, nome: materiais.nome })
    .from(arteiroPecaMateriais)
    .innerJoin(materiais, eq(materiais.id, arteiroPecaMateriais.materialId))
    .where(and(...conditions))
    .orderBy(asc(materiais.ordem), asc(materiais.nome));

  for (const { pecaId, ...material } of rows) {
    result.set(pecaId, [...(result.get(pecaId) ?? []), material]);
  }
  return result;
}

async function toDTO(row: typeof arteiroPecas.$inferSelect): Promise<ArteiroPeca> {
  const [imagens, materiaisPorPeca] = await Promise.all([loadImagens(row.id), loadPecaMateriais([row.id])]);
  return toArteiroPecaDTO(row, imagens, materiaisPorPeca.get(row.id) ?? []);
}

async function validarMateriais(materialIds: string[]): Promise<string[]> {
  const ids = Array.from(new Set(materialIds));
  if (ids.length) {
    const existentes = await db
      .select({ id: materiais.id })
      .from(materiais)
      .where(and(inArray(materiais.id, ids), isNull(materiais.deletedAt)));
    if (existentes.length !== ids.length) {
      throw new AppError('Um ou mais materiais informados não existem', 400);
    }
  }
  return ids;
}

function substituirMateriais(pecaId: number, materialIds: string[]) {
  db.transaction((tx) => {
    tx.delete(arteiroPecaMateriais).where(eq(arteiroPecaMateriais.pecaId, pecaId)).run();
    if (materialIds.length) {
      tx.insert(arteiroPecaMateriais)
        .values(materialIds.map((materialId) => ({ pecaId, materialId })))
        .run();
    }
  });
}

async function insertImagens(pecaId: number, imagens: ImagemFile[]) {
  if (!imagens.length) return;
  const [{ value }] = await db
    .select({ value: max(arteiroPecaImagens.ordem) })
    .from(arteiroPecaImagens)
    .where(eq(arteiroPecaImagens.pecaId, pecaId));
  let ordem = (value ?? -1) + 1;
  await db.insert(arteiroPecaImagens).values(
    imagens.map((imagem) => ({
      pecaId,
      imagem: imagem.buffer,
      imagemType: imagem.mimeType,
      ordem: ordem++,
    })),
  );
}

export async function listPecas(arteiroId: number): Promise<ArteiroPeca[]> {
  await assertArteiroExists(arteiroId);
  const rows = await db.select().from(arteiroPecas).where(eq(arteiroPecas.arteiroId, arteiroId)).orderBy(asc(arteiroPecas.createdAt));
  const materiaisPorPeca = await loadPecaMateriais(rows.map((row) => row.id));
  const result: ArteiroPeca[] = [];
  for (const row of rows) {
    result.push(toArteiroPecaDTO(row, await loadImagens(row.id), materiaisPorPeca.get(row.id) ?? []));
  }
  return result;
}

export async function createPeca(
  arteiroId: number,
  input: CreateArteiroPecaInput,
  imagens: ImagemFile[],
): Promise<ArteiroPeca> {
  await assertArteiroExists(arteiroId);
  const materialIds = await validarMateriais(input.materialIds ?? []);

  const [row] = await db
    .insert(arteiroPecas)
    .values({
      arteiroId,
      nome: input.nome,
      valorSugerido: input.valorSugerido ?? null,
      descricao: input.descricao,
    })
    .returning();

  substituirMateriais(row.id, materialIds);
  await insertImagens(row.id, imagens);

  return toDTO(row);
}

export async function updatePeca(
  arteiroId: number,
  pecaId: number,
  input: UpdateArteiroPecaInput,
  novasImagens: ImagemFile[],
): Promise<ArteiroPeca> {
  const current = await findPeca(arteiroId, pecaId);
  if (!current) {
    throw new AppError('Peça não encontrada', 404);
  }
  const materialIds = input.materialIds !== undefined ? await validarMateriais(input.materialIds) : undefined;

  const [row] = await db
    .update(arteiroPecas)
    .set({
      ...(input.nome !== undefined ? { nome: input.nome } : {}),
      ...(input.valorSugerido !== undefined ? { valorSugerido: input.valorSugerido } : {}),
      ...(input.descricao !== undefined ? { descricao: input.descricao } : {}),
      updatedAt: new Date(),
    })
    .where(eq(arteiroPecas.id, pecaId))
    .returning();

  if (materialIds !== undefined) {
    substituirMateriais(pecaId, materialIds);
  }
  await insertImagens(pecaId, novasImagens);

  return toDTO(row);
}

export async function deletePeca(arteiroId: number, pecaId: number): Promise<void> {
  const current = await findPeca(arteiroId, pecaId);
  if (!current) {
    throw new AppError('Peça não encontrada', 404);
  }

  await db.delete(arteiroPecaImagens).where(eq(arteiroPecaImagens.pecaId, pecaId));
  await db.delete(arteiroPecaMateriais).where(eq(arteiroPecaMateriais.pecaId, pecaId));
  await db.delete(arteiroPecas).where(eq(arteiroPecas.id, pecaId));
}

export async function deletePecaImagem(arteiroId: number, pecaId: number, imagemId: number): Promise<void> {
  const peca = await findPeca(arteiroId, pecaId);
  if (!peca) {
    throw new AppError('Peça não encontrada', 404);
  }

  const [imagem] = await db
    .select()
    .from(arteiroPecaImagens)
    .where(and(eq(arteiroPecaImagens.id, imagemId), eq(arteiroPecaImagens.pecaId, pecaId)));
  if (!imagem) {
    throw new AppError('Imagem não encontrada', 404);
  }

  await db.delete(arteiroPecaImagens).where(eq(arteiroPecaImagens.id, imagemId));
}

export async function getPecaImagem(imagemId: number): Promise<ImagemFile | null> {
  const [row] = await db.select().from(arteiroPecaImagens).where(eq(arteiroPecaImagens.id, imagemId));
  if (!row) return null;
  return { buffer: row.imagem, mimeType: row.imagemType };
}
