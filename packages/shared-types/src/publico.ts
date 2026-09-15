import type { ArteiroMaterialRef } from './arteiro';
import type { ArteiroPecaImagem } from './arteiro-peca';
import type { ArteiroCurso, ArteiroEvento, ArteiroPremio, ArteiroProjeto, ArteiroVideo } from './arteiro-child';

// DTOs da API pública (/api/publico), consumida pelo site sem autenticação.
// Só expõe arteiros ativos e não excluídos. Do telefone, só o número normalizado para o WhatsApp;
// SICAB e o telefone como cadastrado não são expostos.

export interface PublicoArteiroRef {
  id: number;
  nome: string;
  logotipoUrl: string | null;
}

export interface PublicoPecaResumo {
  id: number;
  nome: string;
  valorSugerido: number | null;
  imagemUrl: string | null;
  totalImagens: number;
  arteiro: PublicoArteiroRef;
  // Materiais da peça; se a peça não tiver nenhum, os materiais com que o arteiro trabalha.
  materiais: ArteiroMaterialRef[];
}

export interface PublicoPeca extends PublicoPecaResumo {
  descricao: string;
  imagens: ArteiroPecaImagem[];
  createdAt: string;
}

export interface PublicoArteiroResumo extends PublicoArteiroRef {
  grupo: string | null;
  arroba: string | null;
  biografia: string | null;
  // Telefone só com dígitos e DDI (ex.: 5512982030394), pronto para https://wa.me/. Nulo se inválido.
  whatsapp: string | null;
  materiais: ArteiroMaterialRef[];
  totalPecas: number;
  createdAt: string;
}

export interface PublicoArteiro extends PublicoArteiroResumo {
  redesSociais: string | null;
  pecas: PublicoPecaResumo[];
  premios: ArteiroPremio[];
  videos: ArteiroVideo[];
  eventos: ArteiroEvento[];
  cursos: ArteiroCurso[];
  projetos: ArteiroProjeto[];
}

export interface PublicoPecaDetalhe {
  peca: PublicoPeca;
  arteiro: PublicoArteiroResumo;
  outrasPecas: PublicoPecaResumo[];
}

export interface ListPublicoPecasQuery {
  search?: string;
  materialId?: string;
  arteiroId?: number;
  page?: number;
  pageSize?: number;
}

export interface ListPublicoPecasResult {
  items: PublicoPecaResumo[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ListPublicoArteirosQuery {
  // 'recentes': cadastrados mais recentemente primeiro; 'nome': ordem alfabética (catálogo).
  ordem?: 'recentes' | 'nome';
  page?: number;
  pageSize?: number;
}

export interface ListPublicoArteirosResult {
  items: PublicoArteiroResumo[];
  total: number;
  page: number;
  pageSize: number;
}

// Opções dos filtros da vitrine: só materiais e arteiros que têm peças publicadas,
// cada um com o total de peças que o filtro encontra.
export interface PublicoFiltros {
  materiais: (ArteiroMaterialRef & { thumbnailUrl: string | null; totalPecas: number })[];
  arteiros: { id: number; nome: string; totalPecas: number; createdAt: string }[];
}
