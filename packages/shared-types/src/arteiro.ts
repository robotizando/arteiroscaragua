import { z } from 'zod';
import type { ArteiroPeca } from './arteiro-peca';
import type { ArteiroCurso, ArteiroEvento, ArteiroPremio, ArteiroProjeto, ArteiroVideo } from './arteiro-child';

export const ARTEIRO_STATUSES = ['ativo', 'inativo'] as const;
export type ArteiroStatus = (typeof ARTEIRO_STATUSES)[number];

export const ARTEIRO_LOGOTIPO_MAX_BYTES = 2 * 1024 * 1024;
export const ARTEIRO_LOGOTIPO_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const;

export interface ArteiroMaterialRef {
  id: string;
  nome: string;
}

export interface ArteiroBase {
  id: number;
  nome: string;
  telefone: string | null;
  sicab: string | null;
  grupo: string | null;
  arroba: string | null;
  redesSociais: string | null;
  biografia: string | null;
  logotipoUrl: string | null;
  estado: ArteiroStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface Arteiro extends ArteiroBase {
  materiais: ArteiroMaterialRef[];
  pecas: ArteiroPeca[];
  premios: ArteiroPremio[];
  videos: ArteiroVideo[];
  eventos: ArteiroEvento[];
  cursos: ArteiroCurso[];
  projetos: ArteiroProjeto[];
}

export type ArteiroSummary = ArteiroBase;

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .or(z.literal('').transform(() => undefined));

export const createArteiroSchema = z.object({
  nome: z.string().trim().min(2, 'Nome muito curto').max(150, 'Nome muito longo'),
  telefone: optionalText(30),
  sicab: optionalText(50),
  grupo: optionalText(120),
  arroba: optionalText(60),
  redesSociais: optionalText(2000),
  biografia: optionalText(5000),
  estado: z.enum(ARTEIRO_STATUSES).default('ativo'),
});

export const updateArteiroSchema = z.object({
  nome: z.string().trim().min(2, 'Nome muito curto').max(150, 'Nome muito longo').optional(),
  telefone: optionalText(30).nullable(),
  sicab: optionalText(50).nullable(),
  grupo: optionalText(120).nullable(),
  arroba: optionalText(60).nullable(),
  redesSociais: optionalText(2000).nullable(),
  biografia: optionalText(5000).nullable(),
  estado: z.enum(ARTEIRO_STATUSES).optional(),
  removeLogotipo: z.preprocess((value) => value === true || value === 'true', z.boolean()).optional(),
});

export type CreateArteiroInput = z.infer<typeof createArteiroSchema>;
export type UpdateArteiroInput = z.infer<typeof updateArteiroSchema>;

export const setArteiroMateriaisSchema = z.object({
  materialIds: z.array(z.string().min(1)).default([]),
});

export type SetArteiroMateriaisInput = z.infer<typeof setArteiroMateriaisSchema>;

export interface ListArteirosQuery {
  search?: string;
  estado?: ArteiroStatus;
  page?: number;
  pageSize?: number;
}

export interface ListArteirosResult {
  items: ArteiroSummary[];
  total: number;
  page: number;
  pageSize: number;
}
