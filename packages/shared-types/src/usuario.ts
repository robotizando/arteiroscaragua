import { z } from 'zod';

// Usuários "normais", separados dos usuários da Admin. Ser arteiro é ter um perfil de
// arteiro vinculado (usuario_arteiros); ser moderador é uma flag independente disso.

// Filtro da listagem: moderadores, usuários com perfil de arteiro ou com perfil verificado.
export const USUARIO_PAPEIS = ['moderador', 'arteiro', 'arteiro_verificado'] as const;
export type UsuarioPapel = (typeof USUARIO_PAPEIS)[number];

export const USUARIO_STATUSES = ['ativo', 'bloqueado'] as const;
export type UsuarioStatus = (typeof USUARIO_STATUSES)[number];

// Por enquanto cada usuário arteiro tem exatamente um perfil de arteiro,
// mas a tabela de vínculo (usuario_arteiros) já é n..n.
export const USUARIO_MAX_ARTEIROS = 1;

// Política de senha: mínimo 8 caracteres, com maiúscula, número e símbolo.
// Máximo de 72 caracteres por limitação do bcrypt (bytes além disso são ignorados).
export const senhaSchema = z
  .string()
  .min(8, 'A senha deve ter no mínimo 8 caracteres')
  .max(72, 'A senha deve ter no máximo 72 caracteres')
  .regex(/[A-Z]/, 'A senha deve conter ao menos uma letra maiúscula')
  .regex(/[0-9]/, 'A senha deve conter ao menos um número')
  .regex(/[^A-Za-z0-9]/, 'A senha deve conter ao menos um símbolo');

// Mesmas regras do senhaSchema, para exibir a lista de requisitos no formulário.
export const SENHA_REGRAS = [
  { descricao: 'Mínimo de 8 caracteres', valida: (senha: string) => senha.length >= 8 },
  { descricao: 'Uma letra maiúscula', valida: (senha: string) => /[A-Z]/.test(senha) },
  { descricao: 'Um número', valida: (senha: string) => /[0-9]/.test(senha) },
  { descricao: 'Um símbolo', valida: (senha: string) => /[^A-Za-z0-9]/.test(senha) },
] as const;

export interface UsuarioArteiroRef {
  id: number;
  nome: string;
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  moderador: boolean;
  // Perfil de artesão verificado. Só pode ser verdadeiro com um perfil de arteiro vinculado.
  arteiroVerificado: boolean;
  estado: UsuarioStatus;
  possuiSenha: boolean;
  googleVinculado: boolean;
  emailVerificadoEm: string | null;
  termosAceitosEm: string | null;
  ultimoLoginEm: string | null;
  arteiros: UsuarioArteiroRef[];
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

const nomeSchema = z.string().trim().min(2, 'Nome muito curto').max(150, 'Nome muito longo');
const emailSchema = z.string().trim().toLowerCase().email('E-mail inválido');
const optionalSenhaSchema = senhaSchema.optional().or(z.literal('').transform(() => undefined));

export const createUsuarioSchema = z.object({
  nome: nomeSchema,
  email: emailSchema,
  moderador: z.boolean().default(false),
  arteiroVerificado: z.boolean().default(false),
  estado: z.enum(USUARIO_STATUSES).default('ativo'),
  // Opcional: o usuário pode definir a senha depois (recuperação de senha) ou entrar com Google.
  senha: optionalSenhaSchema,
  emailVerificado: z.boolean().default(false),
  // Vincula um perfil de arteiro existente. Se omitido e criarPerfilArteiro for verdadeiro,
  // um novo perfil é criado com o nome do usuário; se falso, o usuário fica sem perfil.
  arteiroId: z.coerce.number().int().positive().optional(),
  criarPerfilArteiro: z.boolean().default(true),
});

export const updateUsuarioSchema = z.object({
  nome: nomeSchema.optional(),
  email: emailSchema.optional(),
  moderador: z.boolean().optional(),
  arteiroVerificado: z.boolean().optional(),
  estado: z.enum(USUARIO_STATUSES).optional(),
  senha: optionalSenhaSchema,
  emailVerificado: z.boolean().optional(),
});

export const setUsuarioArteirosSchema = z.object({
  arteiroIds: z
    .array(z.coerce.number().int().positive())
    .max(USUARIO_MAX_ARTEIROS, `Um usuário pode ter no máximo ${USUARIO_MAX_ARTEIROS} perfil(is) de arteiro`),
});

export type CreateUsuarioInput = z.infer<typeof createUsuarioSchema>;
export type UpdateUsuarioInput = z.infer<typeof updateUsuarioSchema>;
export type SetUsuarioArteirosInput = z.infer<typeof setUsuarioArteirosSchema>;

export interface ListUsuariosQuery {
  search?: string;
  papel?: UsuarioPapel;
  estado?: UsuarioStatus;
  page?: number;
  pageSize?: number;
}

export interface ListUsuariosResult {
  items: Usuario[];
  total: number;
  page: number;
  pageSize: number;
}
