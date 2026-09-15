import { z } from 'zod';
import type { ArteiroMaterialRef } from './arteiro';

export const ARTEIRO_PECA_IMAGEM_MAX_BYTES = 3 * 1024 * 1024;
export const ARTEIRO_PECA_IMAGEM_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const;
export const ARTEIRO_PECA_MAX_IMAGENS = 8;
export const ARTEIRO_PECA_MAX_MATERIAIS = 30;

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
  materiais: ArteiroMaterialRef[];
  createdAt: string;
  updatedAt: string;
}

// A peça é enviada como multipart (por causa das imagens), então a lista de materiais chega
// como texto JSON ('["id1","id2"]'); isso também permite enviar a lista vazia.
const materialIdsSchema = z.preprocess(
  (value) => {
    if (typeof value !== 'string') return value;
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  },
  z
    .array(z.string().min(1))
    .max(ARTEIRO_PECA_MAX_MATERIAIS, `Uma peça pode ter no máximo ${ARTEIRO_PECA_MAX_MATERIAIS} materiais`),
);

export const createArteiroPecaSchema = z.object({
  nome: z.string().trim().min(2, 'Nome muito curto').max(150, 'Nome muito longo'),
  valorSugerido: z.coerce.number().min(0).optional(),
  descricao: z.string().trim().min(2, 'Descrição muito curta').max(2000, 'Descrição muito longa'),
  materialIds: materialIdsSchema.optional(),
});

export const updateArteiroPecaSchema = z.object({
  nome: z.string().trim().min(2, 'Nome muito curto').max(150, 'Nome muito longo').optional(),
  valorSugerido: z.coerce.number().min(0).nullable().optional(),
  descricao: z.string().trim().min(2, 'Descrição muito curta').max(2000, 'Descrição muito longa').optional(),
  // Quando informado, substitui a lista inteira.
  materialIds: materialIdsSchema.optional(),
});

export type CreateArteiroPecaInput = z.infer<typeof createArteiroPecaSchema>;
export type UpdateArteiroPecaInput = z.infer<typeof updateArteiroPecaSchema>;
