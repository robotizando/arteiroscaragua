// Log de acesso: todo login e toda tentativa de login (com ou sem sucesso),
// tanto de usuários da Admin quanto de usuários normais (arteiros, moderadores).
export const ACESSO_ATORES = ['admin', 'usuario'] as const;
export type AcessoAtor = (typeof ACESSO_ATORES)[number];

export const ACESSO_METODOS = ['google', 'senha'] as const;
export type AcessoMetodo = (typeof ACESSO_METODOS)[number];

export interface AcessoLog {
  id: number;
  ator: AcessoAtor;
  metodo: AcessoMetodo;
  sucesso: boolean;
  // Código do motivo da falha (ex.: not_authorized, senha_invalida, email_nao_verificado).
  motivo: string | null;
  email: string | null;
  adminUserId: string | null;
  usuarioId: string | null;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface ListAcessosQuery {
  ator?: AcessoAtor;
  usuarioId?: string;
  adminUserId?: string;
  email?: string;
  sucesso?: boolean;
  page?: number;
  pageSize?: number;
}

export interface ListAcessosResult {
  items: AcessoLog[];
  total: number;
  page: number;
  pageSize: number;
}
