import type {
  Arteiro,
  ArteiroCurso,
  ArteiroEvento,
  ArteiroMaterialRef,
  ArteiroPeca,
  ArteiroPecaImagem,
  ArteiroPremio,
  ArteiroProjeto,
  ArteiroSummary,
  ArteiroVideo,
} from '@arteiroscaragua/shared-types';
import type {
  ArteiroCursoRow,
  ArteiroEventoRow,
  ArteiroPecaImagemRow,
  ArteiroPecaRow,
  ArteiroPremioRow,
  ArteiroProjetoRow,
  ArteiroRow,
  ArteiroVideoRow,
} from '../../database/client';

export function toArteiroSummaryDTO(row: ArteiroRow): ArteiroSummary {
  return {
    id: row.id,
    nome: row.nome,
    telefone: row.telefone,
    sicab: row.sicab,
    grupo: row.grupo,
    arroba: row.arroba,
    redesSociais: row.redesSociais,
    biografia: row.biografia,
    logotipoUrl: row.logotipo ? `/api/arteiros/${row.id}/logotipo?v=${row.updatedAt.getTime()}` : null,
    estado: row.estado,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    deletedAt: row.deletedAt ? row.deletedAt.toISOString() : null,
  };
}

export function toArteiroPecaImagemDTO(row: ArteiroPecaImagemRow): ArteiroPecaImagem {
  return {
    id: row.id,
    url: `/api/arteiros/pecas/imagens/${row.id}`,
    ordem: row.ordem,
  };
}

export function toArteiroPecaDTO(row: ArteiroPecaRow, imagens: ArteiroPecaImagemRow[]): ArteiroPeca {
  return {
    id: row.id,
    arteiroId: row.arteiroId,
    nome: row.nome,
    valorSugerido: row.valorSugerido,
    descricao: row.descricao,
    imagens: imagens.map(toArteiroPecaImagemDTO),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toArteiroPremioDTO(row: ArteiroPremioRow): ArteiroPremio {
  return {
    id: row.id,
    arteiroId: row.arteiroId,
    nome: row.nome,
    ano: row.ano,
    categoria: row.categoria,
    instituicao: row.instituicao,
    descricao: row.descricao,
  };
}

export function toArteiroVideoDTO(row: ArteiroVideoRow): ArteiroVideo {
  return { id: row.id, arteiroId: row.arteiroId, url: row.url };
}

export function toArteiroEventoDTO(row: ArteiroEventoRow): ArteiroEvento {
  return {
    id: row.id,
    arteiroId: row.arteiroId,
    nome: row.nome,
    mesAno: row.mesAno,
    descricaoParticipacao: row.descricaoParticipacao,
  };
}

export function toArteiroCursoDTO(row: ArteiroCursoRow): ArteiroCurso {
  return {
    id: row.id,
    arteiroId: row.arteiroId,
    nome: row.nome,
    cargaHoraria: row.cargaHoraria,
    descricao: row.descricao,
    tipoParticipacao: row.tipoParticipacao,
  };
}

export function toArteiroProjetoDTO(row: ArteiroProjetoRow): ArteiroProjeto {
  return { id: row.id, arteiroId: row.arteiroId, descricao: row.descricao };
}

export function toArteiroDTO(
  row: ArteiroRow,
  data: {
    materiais: ArteiroMaterialRef[];
    pecas: ArteiroPeca[];
    premios: ArteiroPremioRow[];
    videos: ArteiroVideoRow[];
    eventos: ArteiroEventoRow[];
    cursos: ArteiroCursoRow[];
    projetos: ArteiroProjetoRow[];
  },
): Arteiro {
  return {
    ...toArteiroSummaryDTO(row),
    materiais: data.materiais,
    pecas: data.pecas,
    premios: data.premios.map(toArteiroPremioDTO),
    videos: data.videos.map(toArteiroVideoDTO),
    eventos: data.eventos.map(toArteiroEventoDTO),
    cursos: data.cursos.map(toArteiroCursoDTO),
    projetos: data.projetos.map(toArteiroProjetoDTO),
  };
}
