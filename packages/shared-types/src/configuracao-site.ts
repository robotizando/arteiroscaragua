import { z } from 'zod';

export interface ConfiguracaoSite {
  capaUrl: string | null;
  logotipoUrl: string | null;
  // Campos em HTML (gerados pelo editor WYSIWYG e sanitizados no backend).
  termosUso: string;
  politicaPrivacidade: string;
  quemSomos: string;
  // Barra de destaque acima do cabeçalho do site. Texto simples; cor em #RRGGBB; altura em px.
  destaqueTexto: string;
  destaqueAtivo: boolean;
  destaqueCor: string;
  destaqueAltura: number;
  updatedAt: string | null;
}

export const CONFIGURACAO_SITE_CAPA_MAX_BYTES = 5 * 1024 * 1024;
export const CONFIGURACAO_SITE_CAPA_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const CONFIGURACAO_SITE_LOGOTIPO_MAX_BYTES = 2 * 1024 * 1024;
export const CONFIGURACAO_SITE_LOGOTIPO_MIME_TYPES = ['image/png', 'image/webp', 'image/jpeg'] as const;
export const CONFIGURACAO_SITE_TEXTO_MAX_CHARS = 200_000;

export const DESTAQUE_TEXTO_MAX_CHARS = 200;
export const DESTAQUE_ALTURA_MIN = 24;
export const DESTAQUE_ALTURA_MAX = 120;
export const DESTAQUE_ALTURA_PADRAO = 36;
export const DESTAQUE_COR_PADRAO = '#B5DCA1';
export const DESTAQUE_COR_REGEX = /^#[0-9a-fA-F]{6}$/;

// Cor do texto da barra de destaque: tinta escura ou areia, a que contrastar mais com o fundo.
export function corTextoDestaque(corFundo: string): string {
  if (!DESTAQUE_COR_REGEX.test(corFundo)) return '#1B2A2F';
  const [r, g, b] = [1, 3, 5].map((inicio) => {
    const canal = parseInt(corFundo.slice(inicio, inicio + 2), 16) / 255;
    return canal <= 0.03928 ? canal / 12.92 : ((canal + 0.055) / 1.055) ** 2.4;
  });
  const luminancia = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  // Acima de ~0.21 o contraste com a tinta (#1B2A2F) supera o contraste com a areia (#F6F3EC).
  return luminancia > 0.21 ? '#1B2A2F' : '#F6F3EC';
}

const htmlSchema = z.string().max(CONFIGURACAO_SITE_TEXTO_MAX_CHARS, 'Texto muito longo');

const booleanFormSchema = z.preprocess((value) => value === true || value === 'true', z.boolean());

// Diferente de booleanFormSchema: ausente continua ausente (não vira false e desativa a barra).
const booleanFormOpcionalSchema = z.preprocess(
  (value) => (value === undefined ? undefined : value === true || value === 'true'),
  z.boolean().optional(),
);

export const updateConfiguracaoSiteSchema = z.object({
  termosUso: htmlSchema.optional(),
  politicaPrivacidade: htmlSchema.optional(),
  quemSomos: htmlSchema.optional(),
  removeCapa: booleanFormSchema.optional(),
  removeLogotipo: booleanFormSchema.optional(),
  destaqueTexto: z
    .string()
    .trim()
    .max(DESTAQUE_TEXTO_MAX_CHARS, `O texto do destaque pode ter até ${DESTAQUE_TEXTO_MAX_CHARS} caracteres`)
    .optional(),
  destaqueAtivo: booleanFormOpcionalSchema,
  destaqueCor: z.string().trim().regex(DESTAQUE_COR_REGEX, 'Cor inválida: use o formato #RRGGBB').optional(),
  destaqueAltura: z.coerce
    .number({ invalid_type_error: 'Altura inválida' })
    .int('A altura deve ser um número inteiro')
    .min(DESTAQUE_ALTURA_MIN, `A altura mínima da barra é ${DESTAQUE_ALTURA_MIN}px`)
    .max(DESTAQUE_ALTURA_MAX, `A altura máxima da barra é ${DESTAQUE_ALTURA_MAX}px`)
    .optional(),
});

export type UpdateConfiguracaoSiteInput = z.infer<typeof updateConfiguracaoSiteSchema>;
