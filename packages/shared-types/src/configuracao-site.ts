import { z } from 'zod';

export interface ConfiguracaoSite {
  capaUrl: string | null;
  logotipoUrl: string | null;
  // Campos em HTML (gerados pelo editor WYSIWYG e sanitizados no backend).
  termosUso: string;
  politicaPrivacidade: string;
  quemSomos: string;
  updatedAt: string | null;
}

export const CONFIGURACAO_SITE_CAPA_MAX_BYTES = 5 * 1024 * 1024;
export const CONFIGURACAO_SITE_CAPA_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const CONFIGURACAO_SITE_LOGOTIPO_MAX_BYTES = 2 * 1024 * 1024;
export const CONFIGURACAO_SITE_LOGOTIPO_MIME_TYPES = ['image/png', 'image/webp', 'image/jpeg'] as const;
export const CONFIGURACAO_SITE_TEXTO_MAX_CHARS = 200_000;

const htmlSchema = z.string().max(CONFIGURACAO_SITE_TEXTO_MAX_CHARS, 'Texto muito longo');

const booleanFormSchema = z.preprocess((value) => value === true || value === 'true', z.boolean());

export const updateConfiguracaoSiteSchema = z.object({
  termosUso: htmlSchema.optional(),
  politicaPrivacidade: htmlSchema.optional(),
  quemSomos: htmlSchema.optional(),
  removeCapa: booleanFormSchema.optional(),
  removeLogotipo: booleanFormSchema.optional(),
});

export type UpdateConfiguracaoSiteInput = z.infer<typeof updateConfiguracaoSiteSchema>;
