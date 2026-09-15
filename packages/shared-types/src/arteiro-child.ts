import { z } from 'zod';

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .or(z.literal('').transform(() => undefined));

// Prêmios recebidos
export interface ArteiroPremio {
  id: number;
  arteiroId: number;
  nome: string;
  ano: number;
  categoria: string | null;
  instituicao: string | null;
  descricao: string | null;
}

export const createArteiroPremioSchema = z.object({
  nome: z.string().trim().min(2, 'Nome muito curto').max(150, 'Nome muito longo'),
  ano: z.coerce.number().int().min(1900).max(2100),
  categoria: optionalText(120),
  instituicao: optionalText(150),
  descricao: optionalText(2000),
});
export const updateArteiroPremioSchema = createArteiroPremioSchema.partial();
export type CreateArteiroPremioInput = z.infer<typeof createArteiroPremioSchema>;
export type UpdateArteiroPremioInput = z.infer<typeof updateArteiroPremioSchema>;

// Links para vídeos externos
export interface ArteiroVideo {
  id: number;
  arteiroId: number;
  url: string;
}

export const createArteiroVideoSchema = z.object({
  url: z.string().trim().url('URL inválida').max(500),
});
export const updateArteiroVideoSchema = createArteiroVideoSchema.partial();
export type CreateArteiroVideoInput = z.infer<typeof createArteiroVideoSchema>;
export type UpdateArteiroVideoInput = z.infer<typeof updateArteiroVideoSchema>;

// Eventos que participou
export interface ArteiroEvento {
  id: number;
  arteiroId: number;
  nome: string;
  mesAno: string;
  descricaoParticipacao: string | null;
}

const mesAnoSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Use o formato AAAA-MM');

export const createArteiroEventoSchema = z.object({
  nome: z.string().trim().min(2, 'Nome muito curto').max(150, 'Nome muito longo'),
  mesAno: mesAnoSchema,
  descricaoParticipacao: optionalText(2000),
});
export const updateArteiroEventoSchema = createArteiroEventoSchema.partial();
export type CreateArteiroEventoInput = z.infer<typeof createArteiroEventoSchema>;
export type UpdateArteiroEventoInput = z.infer<typeof updateArteiroEventoSchema>;

// Participação em cursos
export const CURSO_PARTICIPACAO_TIPOS = ['aluno', 'mediador', 'curador', 'palestrante'] as const;
export type CursoParticipacaoTipo = (typeof CURSO_PARTICIPACAO_TIPOS)[number];

export interface ArteiroCurso {
  id: number;
  arteiroId: number;
  nome: string;
  cargaHoraria: number | null;
  descricao: string | null;
  tipoParticipacao: CursoParticipacaoTipo;
}

export const createArteiroCursoSchema = z.object({
  nome: z.string().trim().min(2, 'Nome muito curto').max(150, 'Nome muito longo'),
  cargaHoraria: z.coerce.number().int().min(0).optional(),
  descricao: optionalText(2000),
  tipoParticipacao: z.enum(CURSO_PARTICIPACAO_TIPOS).default('aluno'),
});
export const updateArteiroCursoSchema = createArteiroCursoSchema.partial();
export type CreateArteiroCursoInput = z.infer<typeof createArteiroCursoSchema>;
export type UpdateArteiroCursoInput = z.infer<typeof updateArteiroCursoSchema>;

// Projetos
export interface ArteiroProjeto {
  id: number;
  arteiroId: number;
  descricao: string;
}

export const createArteiroProjetoSchema = z.object({
  descricao: z.string().trim().min(2, 'Descrição muito curta').max(2000, 'Descrição muito longa'),
});
export const updateArteiroProjetoSchema = createArteiroProjetoSchema.partial();
export type CreateArteiroProjetoInput = z.infer<typeof createArteiroProjetoSchema>;
export type UpdateArteiroProjetoInput = z.infer<typeof updateArteiroProjetoSchema>;
