import { and, asc, desc, eq, exists, inArray, isNull, ne, or, sql } from 'drizzle-orm';
import type {
  ArteiroMaterialRef,
  ArteiroPecaImagem,
  ListPublicoArteirosQuery,
  ListPublicoArteirosResult,
  ListPublicoPecasQuery,
  ListPublicoPecasResult,
  PublicoArteiro,
  PublicoArteiroResumo,
  PublicoFiltros,
  PublicoPecaDetalhe,
  PublicoPecaResumo,
} from '@arteiroscaragua/shared-types';
import {
  db,
  arteiroCursos,
  arteiroEventos,
  arteiroMateriais,
  arteiroPecaImagens,
  arteiroPecaMateriais,
  arteiroPecas,
  arteiroPremios,
  arteiroProjetos,
  arteiroVideos,
  arteiros,
  materiais,
  normalizarBusca,
} from '../../database/client';
import { AppError } from '../../middlewares/error-handler';
import {
  arteiroLogotipoUrl,
  pecaImagemUrl,
  toArteiroCursoDTO,
  toArteiroEventoDTO,
  toArteiroPremioDTO,
  toArteiroProjetoDTO,
  toArteiroVideoDTO,
} from '../arteiros/arteiros.mapper';
import { loadPecaMateriais } from '../arteiros/pecas.service';
import { materialThumbnailUrl } from '../materiais/materiais.mapper';

const PAGE_SIZE_PADRAO = 24;
const MAX_PAGE_SIZE = 60;
const MAX_OUTRAS_PECAS = 8;

// Só arteiros ativos e não excluídos aparecem no site.
const arteiroPublico = and(isNull(arteiros.deletedAt), eq(arteiros.estado, 'ativo'));

// Colunas explícitas: as tabelas guardam imagens em blob, que não devem ser lidas nas listagens.
const temLogotipo = sql<boolean>`(${arteiros.logotipo} is not null)`.mapWith(Boolean);

const arteiroColunas = {
  id: arteiros.id,
  nome: arteiros.nome,
  grupo: arteiros.grupo,
  arroba: arteiros.arroba,
  biografia: arteiros.biografia,
  redesSociais: arteiros.redesSociais,
  telefone: arteiros.telefone,
  temLogotipo,
  createdAt: arteiros.createdAt,
  updatedAt: arteiros.updatedAt,
};

const pecaColunas = {
  id: arteiroPecas.id,
  nome: arteiroPecas.nome,
  valorSugerido: arteiroPecas.valorSugerido,
  descricao: arteiroPecas.descricao,
  createdAt: arteiroPecas.createdAt,
  arteiroId: arteiros.id,
  arteiroNome: arteiros.nome,
  arteiroTemLogotipo: temLogotipo,
  arteiroUpdatedAt: arteiros.updatedAt,
};

function selectPecas() {
  return db.select(pecaColunas).from(arteiroPecas).innerJoin(arteiros, eq(arteiros.id, arteiroPecas.arteiroId));
}

function selectArteiros() {
  return db.select(arteiroColunas).from(arteiros);
}

type PecaColunasRow = Awaited<ReturnType<typeof selectPecas>>[number];
type ArteiroColunasRow = Awaited<ReturnType<typeof selectArteiros>>[number];

function logotipoUrl(id: number, temLogo: boolean, updatedAt: Date): string | null {
  return temLogo ? arteiroLogotipoUrl(id, updatedAt) : null;
}

// Os telefones foram cadastrados em formatos variados ("(11) 97568-5719", "1298203-0394",
// "+5512982070472"). Aceita DDD + número (10 ou 11 dígitos), com ou sem o DDI 55.
export function whatsappDe(telefone: string | null): string | null {
  const digitos = telefone?.replace(/\D/g, '') ?? '';
  if (digitos.length === 10 || digitos.length === 11) return `55${digitos}`;
  if ((digitos.length === 12 || digitos.length === 13) && digitos.startsWith('55')) return digitos;
  return null;
}

async function loadMateriais(arteiroIds: number[]): Promise<Map<number, ArteiroMaterialRef[]>> {
  const result = new Map<number, ArteiroMaterialRef[]>();
  if (!arteiroIds.length) return result;

  const rows = await db
    .select({ arteiroId: arteiroMateriais.arteiroId, id: materiais.id, nome: materiais.nome })
    .from(arteiroMateriais)
    .innerJoin(materiais, eq(materiais.id, arteiroMateriais.materialId))
    .where(
      and(inArray(arteiroMateriais.arteiroId, arteiroIds), isNull(materiais.deletedAt), eq(materiais.estado, 'ativo')),
    )
    .orderBy(asc(materiais.ordem), asc(materiais.nome));

  for (const { arteiroId, ...material } of rows) {
    result.set(arteiroId, [...(result.get(arteiroId) ?? []), material]);
  }
  return result;
}

async function loadImagens(pecaIds: number[]): Promise<Map<number, ArteiroPecaImagem[]>> {
  const result = new Map<number, ArteiroPecaImagem[]>();
  if (!pecaIds.length) return result;

  const rows = await db
    .select({ id: arteiroPecaImagens.id, pecaId: arteiroPecaImagens.pecaId, ordem: arteiroPecaImagens.ordem })
    .from(arteiroPecaImagens)
    .where(inArray(arteiroPecaImagens.pecaId, pecaIds))
    .orderBy(asc(arteiroPecaImagens.ordem), asc(arteiroPecaImagens.id));

  for (const row of rows) {
    result.set(row.pecaId, [...(result.get(row.pecaId) ?? []), { id: row.id, url: pecaImagemUrl(row.id), ordem: row.ordem }]);
  }
  return result;
}

async function toPecaResumos(rows: PecaColunasRow[]): Promise<PublicoPecaResumo[]> {
  const [imagens, materiaisPorPeca, materiaisPorArteiro] = await Promise.all([
    loadImagens(rows.map((row) => row.id)),
    loadPecaMateriais(
      rows.map((row) => row.id),
      { apenasAtivos: true },
    ),
    loadMateriais(Array.from(new Set(rows.map((row) => row.arteiroId)))),
  ]);

  return rows.map((row) => {
    const imagensPeca = imagens.get(row.id) ?? [];
    const materiaisPeca = materiaisPorPeca.get(row.id) ?? [];
    return {
      id: row.id,
      nome: row.nome,
      valorSugerido: row.valorSugerido,
      imagemUrl: imagensPeca[0]?.url ?? null,
      totalImagens: imagensPeca.length,
      arteiro: {
        id: row.arteiroId,
        nome: row.arteiroNome,
        logotipoUrl: logotipoUrl(row.arteiroId, row.arteiroTemLogotipo, row.arteiroUpdatedAt),
      },
      materiais: materiaisPeca.length ? materiaisPeca : (materiaisPorArteiro.get(row.arteiroId) ?? []),
    };
  });
}

async function toArteiroResumos(rows: ArteiroColunasRow[]): Promise<PublicoArteiroResumo[]> {
  const ids = rows.map((row) => row.id);
  const [materiaisPorArteiro, contagens] = await Promise.all([
    loadMateriais(ids),
    ids.length
      ? db
          .select({ arteiroId: arteiroPecas.arteiroId, total: sql<number>`count(*)` })
          .from(arteiroPecas)
          .where(inArray(arteiroPecas.arteiroId, ids))
          .groupBy(arteiroPecas.arteiroId)
      : [],
  ]);
  const totalPorArteiro = new Map(contagens.map((row) => [row.arteiroId, row.total]));

  return rows.map((row) => ({
    id: row.id,
    nome: row.nome,
    logotipoUrl: logotipoUrl(row.id, row.temLogotipo, row.updatedAt),
    grupo: row.grupo,
    arroba: row.arroba,
    biografia: row.biografia,
    whatsapp: whatsappDe(row.telefone),
    materiais: materiaisPorArteiro.get(row.id) ?? [],
    totalPecas: totalPorArteiro.get(row.id) ?? 0,
    createdAt: row.createdAt.toISOString(),
  }));
}

async function findArteiro(id: number) {
  const [row] = await selectArteiros().where(and(eq(arteiros.id, id), arteiroPublico));
  if (!row) {
    throw new AppError('Arteiro não encontrado', 404);
  }
  return row;
}

export async function listPecas(query: ListPublicoPecasQuery): Promise<ListPublicoPecasResult> {
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, query.pageSize ?? PAGE_SIZE_PADRAO));

  const conditions = [arteiroPublico];
  if (query.arteiroId) {
    conditions.push(eq(arteiroPecas.arteiroId, query.arteiroId));
  }
  if (query.materialId) {
    // A peça entra se o arteiro trabalha com o material OU se a própria peça tem o material.
    conditions.push(
      or(
        exists(
          db
            .select({ um: sql`1` })
            .from(arteiroMateriais)
            .where(and(eq(arteiroMateriais.arteiroId, arteiros.id), eq(arteiroMateriais.materialId, query.materialId))),
        ),
        exists(
          db
            .select({ um: sql`1` })
            .from(arteiroPecaMateriais)
            .where(
              and(eq(arteiroPecaMateriais.pecaId, arteiroPecas.id), eq(arteiroPecaMateriais.materialId, query.materialId)),
            ),
        ),
      )!,
    );
  }
  const search = query.search?.trim();
  if (search) {
    // Busca sem acentos no nome da peça, na descrição e no nome do arteiro.
    const term = `%${normalizarBusca(search)}%`;
    conditions.push(
      or(
        sql`normalizar(${arteiroPecas.nome}) like ${term}`,
        sql`normalizar(${arteiroPecas.descricao}) like ${term}`,
        sql`normalizar(${arteiros.nome}) like ${term}`,
      )!,
    );
  }

  const where = and(...conditions);

  const [rows, [{ total }]] = await Promise.all([
    selectPecas()
      .where(where)
      .orderBy(desc(arteiroPecas.createdAt), desc(arteiroPecas.id))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db
      .select({ total: sql<number>`count(*)` })
      .from(arteiroPecas)
      .innerJoin(arteiros, eq(arteiros.id, arteiroPecas.arteiroId))
      .where(where),
  ]);

  return { items: await toPecaResumos(rows), total, page, pageSize };
}

export async function getPeca(id: number): Promise<PublicoPecaDetalhe> {
  const [row] = await selectPecas().where(and(eq(arteiroPecas.id, id), arteiroPublico));
  if (!row) {
    throw new AppError('Peça não encontrada', 404);
  }

  const [[resumo], imagens, arteiroRow, outrasRows] = await Promise.all([
    toPecaResumos([row]),
    loadImagens([id]),
    findArteiro(row.arteiroId),
    selectPecas()
      .where(and(eq(arteiroPecas.arteiroId, row.arteiroId), ne(arteiroPecas.id, id)))
      .orderBy(desc(arteiroPecas.createdAt), desc(arteiroPecas.id))
      .limit(MAX_OUTRAS_PECAS),
  ]);

  const [[arteiro], outrasPecas] = await Promise.all([toArteiroResumos([arteiroRow]), toPecaResumos(outrasRows)]);

  return {
    peca: {
      ...resumo,
      descricao: row.descricao,
      imagens: imagens.get(id) ?? [],
      createdAt: row.createdAt.toISOString(),
    },
    arteiro,
    outrasPecas,
  };
}

export async function listArteiros(query: ListPublicoArteirosQuery): Promise<ListPublicoArteirosResult> {
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, query.pageSize ?? PAGE_SIZE_PADRAO));
  // Ordem alfabética sem acentos, para "Érica" ficar junto dos nomes com E.
  const ordem =
    query.ordem === 'nome'
      ? [asc(sql`normalizar(${arteiros.nome})`), asc(arteiros.id)]
      : [desc(arteiros.createdAt), desc(arteiros.id)];

  const [rows, [{ total }]] = await Promise.all([
    selectArteiros()
      .where(arteiroPublico)
      .orderBy(...ordem)
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ total: sql<number>`count(*)` }).from(arteiros).where(arteiroPublico),
  ]);

  return { items: await toArteiroResumos(rows), total, page, pageSize };
}

export async function getArteiro(id: number): Promise<PublicoArteiro> {
  const row = await findArteiro(id);

  const [[resumo], pecaRows, premios, videos, eventos, cursos, projetos] = await Promise.all([
    toArteiroResumos([row]),
    selectPecas().where(eq(arteiroPecas.arteiroId, id)).orderBy(desc(arteiroPecas.createdAt), desc(arteiroPecas.id)),
    db.select().from(arteiroPremios).where(eq(arteiroPremios.arteiroId, id)).orderBy(desc(arteiroPremios.ano)),
    db.select().from(arteiroVideos).where(eq(arteiroVideos.arteiroId, id)).orderBy(asc(arteiroVideos.id)),
    db.select().from(arteiroEventos).where(eq(arteiroEventos.arteiroId, id)).orderBy(desc(arteiroEventos.mesAno)),
    db.select().from(arteiroCursos).where(eq(arteiroCursos.arteiroId, id)).orderBy(asc(arteiroCursos.id)),
    db.select().from(arteiroProjetos).where(eq(arteiroProjetos.arteiroId, id)).orderBy(asc(arteiroProjetos.id)),
  ]);

  return {
    ...resumo,
    redesSociais: row.redesSociais,
    pecas: await toPecaResumos(pecaRows),
    premios: premios.map(toArteiroPremioDTO),
    videos: videos.map(toArteiroVideoDTO),
    eventos: eventos.map(toArteiroEventoDTO),
    cursos: cursos.map(toArteiroCursoDTO),
    projetos: projetos.map(toArteiroProjetoDTO),
  };
}

export async function getFiltros(): Promise<PublicoFiltros> {
  const materialAtivo = and(isNull(materiais.deletedAt), eq(materiais.estado, 'ativo'));
  const materialPecaColunas = {
    id: materiais.id,
    nome: materiais.nome,
    ordem: materiais.ordem,
    temThumbnail: sql<boolean>`(${materiais.thumbnail} is not null)`.mapWith(Boolean),
    updatedAt: materiais.updatedAt,
    pecaId: arteiroPecas.id,
  };

  // Mesmo critério do filtro: a peça conta para o material do arteiro OU para os materiais dela.
  const [doArteiro, daPeca, arteirosRows] = await Promise.all([
    db
      .selectDistinct(materialPecaColunas)
      .from(arteiroMateriais)
      .innerJoin(materiais, eq(materiais.id, arteiroMateriais.materialId))
      .innerJoin(arteiros, eq(arteiros.id, arteiroMateriais.arteiroId))
      .innerJoin(arteiroPecas, eq(arteiroPecas.arteiroId, arteiros.id))
      .where(and(arteiroPublico, materialAtivo)),
    db
      .selectDistinct(materialPecaColunas)
      .from(arteiroPecaMateriais)
      .innerJoin(materiais, eq(materiais.id, arteiroPecaMateriais.materialId))
      .innerJoin(arteiroPecas, eq(arteiroPecas.id, arteiroPecaMateriais.pecaId))
      .innerJoin(arteiros, eq(arteiros.id, arteiroPecas.arteiroId))
      .where(and(arteiroPublico, materialAtivo)),
    db
      .select({
        id: arteiros.id,
        nome: arteiros.nome,
        totalPecas: sql<number>`count(*)`,
        createdAt: arteiros.createdAt,
      })
      .from(arteiros)
      .innerJoin(arteiroPecas, eq(arteiroPecas.arteiroId, arteiros.id))
      .where(arteiroPublico)
      .groupBy(arteiros.id)
      .orderBy(asc(arteiros.nome)),
  ]);

  // Uma peça pode aparecer pelas duas origens: o Set evita contá-la duas vezes.
  const pecasPorMaterial = new Map<string, Omit<(typeof doArteiro)[number], 'pecaId'> & { pecas: Set<number> }>();
  for (const { pecaId, ...material } of [...doArteiro, ...daPeca]) {
    const atual = pecasPorMaterial.get(material.id) ?? { ...material, pecas: new Set<number>() };
    atual.pecas.add(pecaId);
    pecasPorMaterial.set(material.id, atual);
  }
  const materiaisOrdenados = Array.from(pecasPorMaterial.values()).sort(
    (a, b) => a.ordem - b.ordem || a.nome.localeCompare(b.nome, 'pt-BR'),
  );

  return {
    materiais: materiaisOrdenados.map(({ id, nome, temThumbnail, updatedAt, pecas }) => ({
      id,
      nome,
      thumbnailUrl: temThumbnail ? materialThumbnailUrl(id, updatedAt) : null,
      totalPecas: pecas.size,
    })),
    arteiros: arteirosRows.map((arteiro) => ({ ...arteiro, createdAt: arteiro.createdAt.toISOString() })),
  };
}

// Peças favoritadas, na ordem em que os ids chegam (mais recentes primeiro).
// Peças de arteiros inativos ou excluídos simplesmente somem da lista.
export async function listPecasPorIds(ids: number[]): Promise<PublicoPecaResumo[]> {
  if (!ids.length) return [];
  const rows = await selectPecas().where(and(inArray(arteiroPecas.id, ids), arteiroPublico));
  const porId = new Map((await toPecaResumos(rows)).map((peca) => [peca.id, peca]));
  return ids.map((id) => porId.get(id)).filter((peca): peca is PublicoPecaResumo => Boolean(peca));
}

// Todos os materiais ativos, para o seletor do perfil do arteiro no site.
// Difere de getFiltros, que só lista os materiais com peças publicadas.
export async function listMateriais(): Promise<ArteiroMaterialRef[]> {
  return db
    .select({ id: materiais.id, nome: materiais.nome })
    .from(materiais)
    .where(and(isNull(materiais.deletedAt), eq(materiais.estado, 'ativo')))
    .orderBy(asc(materiais.ordem), asc(materiais.nome));
}
