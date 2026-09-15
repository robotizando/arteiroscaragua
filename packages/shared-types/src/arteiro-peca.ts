import { z } from 'zod';

export const ARTEIRO_PECA_IMAGEM_MAX_BYTES = 3 * 1024 * 1024;
export const ARTEIRO_PECA_IMAGEM_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const;
export const ARTEIRO_PECA_MAX_IMAGENS = 8;

export interface ArteiroPecaImagem {
  id: number;
  url: string;
  ordem: number;
}

export interface ArteiroPeca {
  id: number;
  arteiroId: number;
  nome: string;
  valorSugerido: number | null;
  descricao: string;
  imagens: ArteiroPecaImagem[];
  createdAt: string;
  updatedAt: string;
}

export const createArteiroPecaSchema = z.object({
  nome: z.string().trim().min(2, 'Nome muito curto').max(150, 'Nome muito longo'),
  valorSugerido: z.coerce.number().min(0).optional(),
  descricao: z.string().trim().min(2, 'Descrição muito curta').max(2000, 'Descrição muito longa'),
});

export const updateArteiroPecaSchema = z.object({
  nome: z.string().trim().min(2, 'Nome muito curto').max(150, 'Nome muito longo').optional(),
  valorSugerido: z.coerce.number().min(0).nullable().optional(),
  descricao: z.string().trim().min(2, 'Descrição muito curta').max(2000, 'Descrição muito longa').optional(),
});

export type CreateArteiroPecaInput = z.infer<typeof createArteiroPecaSchema>;
export type UpdateArteiroPecaInput = z.infer<typeof updateArteiroPecaSchema>;
