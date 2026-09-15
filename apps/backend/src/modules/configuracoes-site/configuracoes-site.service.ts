import { eq } from 'drizzle-orm';
import sanitizeHtml from 'sanitize-html';
import type { ConfiguracaoSite, UpdateConfiguracaoSiteInput } from '@arteiroscaragua/shared-types';
import { configuracoesSite, db } from '../../database/client';
import { toConfiguracaoSiteDTO } from './configuracoes-site.mapper';

// A tabela guarda uma única linha.
const CONFIGURACAO_ID = 1;

export interface ImagemFile {
  buffer: Buffer;
  mimeType: string;
}

export type ImagemCampo = 'capa' | 'logotipo';

// O HTML é exibido no site público: só passam as tags/atributos que o editor produz.
const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    'p', 'br', 'hr', 'h1', 'h2', 'h3', 'h4', 'blockquote', 'pre', 'code',
    'strong', 'b', 'em', 'i', 'u', 's', 'strike', 'mark', 'sub', 'sup', 'span',
    'ul', 'ol', 'li', 'a',
  ],
  allowedAttributes: {
    a: ['href', 'target', 'rel'],
    ol: ['start'],
    '*': ['style'],
  },
  allowedStyles: {
    '*': { 'text-align': [/^(left|right|center|justify)$/] },
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  transformTags: {
    a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer nofollow' }),
  },
};

function sanitize(html: string): string {
  const clean = sanitizeHtml(html, SANITIZE_OPTIONS).trim();
  // O editor devolve "<p></p>" quando o conteúdo está vazio.
  return clean === '<p></p>' ? '' : clean;
}

async function findRow() {
  const [row] = await db.select().from(configuracoesSite).where(eq(configuracoesSite.id, CONFIGURACAO_ID));
  return row;
}

export async function getConfiguracaoSite(): Promise<ConfiguracaoSite> {
  return toConfiguracaoSiteDTO(await findRow());
}

export async function updateConfiguracaoSite(
  input: UpdateConfiguracaoSiteInput,
  imagens: Partial<Record<ImagemCampo, ImagemFile>> = {},
): Promise<ConfiguracaoSite> {
  const { capa, logotipo } = imagens;
  const values = {
    ...(input.termosUso !== undefined ? { termosUso: sanitize(input.termosUso) } : {}),
    ...(input.politicaPrivacidade !== undefined
      ? { politicaPrivacidade: sanitize(input.politicaPrivacidade) }
      : {}),
    ...(input.quemSomos !== undefined ? { quemSomos: sanitize(input.quemSomos) } : {}),
    // Texto simples: o site o exibe como texto (escapado pelo React), sem HTML.
    ...(input.destaqueTexto !== undefined ? { destaqueTexto: input.destaqueTexto } : {}),
    ...(input.destaqueAtivo !== undefined ? { destaqueAtivo: input.destaqueAtivo } : {}),
    ...(input.destaqueCor !== undefined ? { destaqueCor: input.destaqueCor.toUpperCase() } : {}),
    ...(input.destaqueAltura !== undefined ? { destaqueAltura: input.destaqueAltura } : {}),
    ...(capa
      ? { capa: capa.buffer, capaType: capa.mimeType }
      : input.removeCapa
        ? { capa: null, capaType: null }
        : {}),
    ...(logotipo
      ? { logotipo: logotipo.buffer, logotipoType: logotipo.mimeType }
      : input.removeLogotipo
        ? { logotipo: null, logotipoType: null }
        : {}),
    updatedAt: new Date(),
  };

  const [row] = await db
    .insert(configuracoesSite)
    .values({ id: CONFIGURACAO_ID, ...values })
    .onConflictDoUpdate({ target: configuracoesSite.id, set: values })
    .returning();

  return toConfiguracaoSiteDTO(row);
}

export async function getImagem(campo: ImagemCampo): Promise<ImagemFile | null> {
  const row = await findRow();
  if (!row) return null;
  const [buffer, mimeType] = campo === 'capa' ? [row.capa, row.capaType] : [row.logotipo, row.logotipoType];
  if (!buffer || !mimeType) return null;
  return { buffer, mimeType };
}
