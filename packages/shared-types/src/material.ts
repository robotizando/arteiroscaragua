import { z } from 'zod';

export const MATERIAL_STATUSES = ['ativo', 'desativado'] as const;
export type MaterialStatus = (typeof MATERIAL_STATUSES)[number];

export interface Material {
  id: string;
  nome: string;
  slug: string;
  descricao: string;
  imagemUrl: string | null;
  thumbnailUrl: string | null;
  ordem: number;
  estado: MaterialStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export const MATERIAL_THUMBNAIL_MAX_BYTES = 2 * 1024 * 1024;
export const MATERIAL_THUMBNAIL_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const;

const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Slug inválido: use letras minúsculas, números e hífens')
  .min(2, 'Slug muito curto')
  .max(140, 'Slug muito longo');

export const createMaterialSchema = z.object({
  nome: z.string().trim().min(2, 'Nome muito curto').max(120, 'Nome muito longo'),
  slug: slugSchema.optional(),
  descricao: z.string().trim().min(2, 'Descrição muito curta').max(500, 'Descrição muito longa'),
  imagemUrl: z
    .string()
    .trim()
    .url('URL de imagem inválida')
    .optional()
    .or(z.literal('').transform(() => undefined)),
  ordem: z.coerce.number().int().min(0).default(0),
  estado: z.enum(MATERIAL_STATUSES).default('ativo'),
});

export const updateMaterialSchema = z.object({
  nome: z.string().trim().min(2, 'Nome muito curto').max(120, 'Nome muito longo').optional(),
  slug: slugSchema.optional(),
  descricao: z.string().trim().min(2, 'Descrição muito curta').max(500, 'Descrição muito longa').optional(),
  imagemUrl: z
    .string()
    .trim()
    .url('URL de imagem inválida')
    .optional()
    .or(z.literal('').transform(() => undefined))
    .nullable(),
  ordem: z.coerce.number().int().min(0).optional(),
  estado: z.enum(MATERIAL_STATUSES).optional(),
  removeThumbnail: z
    .preprocess((value) => value === true || value === 'true', z.boolean())
    .optional(),
});

export type CreateMaterialInput = z.infer<typeof createMaterialSchema>;
export type UpdateMaterialInput = z.infer<typeof updateMaterialSchema>;

export interface ListMateriaisQuery {
  search?: string;
  estado?: MaterialStatus;
  page?: number;
  pageSize?: number;
}

export interface ListMateriaisResult {
  items: Material[];
  total: number;
  page: number;
  pageSize: number;
}
