import type { ConfiguracaoSite } from '@arteiroscaragua/shared-types';

// URL do backend vista pelo navegador (imagens, chamadas de conta).
export const PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';
// Endereço público do site, usado em links compartilhados (ex.: mensagem do WhatsApp).
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:4003').replace(/\/$/, '');
// No servidor do Next pode ser um endereço interno.
const SERVER_API_URL = process.env.API_URL || PUBLIC_API_URL;

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public codigo?: string,
    public issues: { path: string; message: string }[] = [],
  ) {
    super(message);
  }
}

// O backend devolve caminhos relativos (/api/...) para imagens.
export function assetUrl(path: string | null | undefined): string | null {
  return path ? `${PUBLIC_API_URL}${path}` : null;
}

async function parseError(res: Response): Promise<ApiError> {
  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
    codigo?: string;
    issues?: { path: string; message: string }[];
  };
  return new ApiError(data.error || 'Não foi possível completar a requisição', res.status, data.codigo, data.issues);
}

// Leitura no servidor (Server Components). Sem `revalidate`, sempre busca dados novos.
export async function apiGet<T>(path: string, options: { revalidate?: number } = {}): Promise<T> {
  const res = await fetch(
    `${SERVER_API_URL}${path}`,
    options.revalidate !== undefined ? { next: { revalidate: options.revalidate } } : { cache: 'no-store' },
  );
  if (!res.ok) throw await parseError(res);
  return res.json() as Promise<T>;
}

export async function apiGetOrNull<T>(path: string, options?: { revalidate?: number }): Promise<T | null> {
  try {
    return await apiGet<T>(path, options);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

// Logotipo e textos mudam pouco: cache de 1 minuto. Se o backend estiver fora, o site
// continua de pé (cabeçalho e rodapé caem no texto padrão).
export async function getConfiguracaoSite(): Promise<ConfiguracaoSite | null> {
  try {
    const { configuracao } = await apiGet<{ configuracao: ConfiguracaoSite }>('/api/configuracoes-site', {
      revalidate: 60,
    });
    return configuracao;
  } catch (error) {
    console.error('[site] Falha ao carregar configurações do site:', error);
    return null;
  }
}

// Chamadas feitas pelo navegador à API de conta.
export async function contaRequest<T>(
  path: string,
  options: { method?: 'GET' | 'POST'; body?: unknown; token?: string | null } = {},
): Promise<T> {
  const res = await fetch(`${PUBLIC_API_URL}/api/conta${path}`, {
    method: options.method ?? 'POST',
    headers: {
      ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
  if (!res.ok) throw await parseError(res);
  return res.json() as Promise<T>;
}

export function mensagemDeErro(error: unknown, fallback = 'Algo deu errado. Tente novamente.'): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof TypeError) return 'Não foi possível conectar ao servidor. Verifique sua conexão.';
  return fallback;
}
