import { z } from 'zod';
import type { Arteiro } from './arteiro';
import type { PublicoPecaResumo } from './publico';
import { senhaSchema, type UsuarioArteiroRef } from './usuario';

// Conta do usuário do site (auto-cadastro e login dos arteiros), separada da Admin.

export const USUARIO_TOKEN_TIPOS = ['verificacao_email', 'recuperacao_senha'] as const;
export type UsuarioTokenTipo = (typeof USUARIO_TOKEN_TIPOS)[number];

// Validade dos links enviados por e-mail.
export const VERIFICACAO_EMAIL_VALIDADE_MS = 24 * 60 * 60 * 1000;
export const RECUPERACAO_SENHA_VALIDADE_MS = 10 * 60 * 1000;

// Códigos de erro devolvidos em `codigo` pela API de conta (e em `?erro=` nos redirects do Google).
export const CONTA_ERRO_CODIGOS = [
  'credenciais_invalidas',
  'email_nao_verificado',
  'bloqueado',
  'token_invalido',
  'cadastro_expirado',
  'email_em_uso',
  'google_falhou',
  'google_indisponivel',
  'google_sem_email',
  'google_email_nao_verificado',
  'google_conflito',
] as const;
export type ContaErroCodigo = (typeof CONTA_ERRO_CODIGOS)[number];

const nomeSchema = z.string().trim().min(2, 'Nome muito curto').max(150, 'Nome muito longo');
const emailSchema = z.string().trim().toLowerCase().email('E-mail inválido').max(254, 'E-mail muito longo');
const aceiteTermosSchema = z.literal(true, {
  errorMap: () => ({ message: 'É preciso aceitar os termos de uso e a política de privacidade' }),
});
const tokenSchema = z.string().trim().min(16, 'Link inválido').max(2000, 'Link inválido');

export const cadastroContaSchema = z.object({
  nome: nomeSchema,
  email: emailSchema,
  senha: senhaSchema,
  aceiteTermos: aceiteTermosSchema,
});

export const loginContaSchema = z.object({
  email: emailSchema,
  senha: z.string().min(1, 'Informe a senha').max(72, 'E-mail ou senha inválidos'),
});

export const emailContaSchema = z.object({ email: emailSchema });

export const tokenContaSchema = z.object({ token: tokenSchema });

export const redefinirSenhaSchema = z.object({ token: tokenSchema, senha: senhaSchema });

export const concluirCadastroGoogleSchema = z.object({
  tokenCadastro: tokenSchema,
  aceiteTermos: aceiteTermosSchema,
});

export const aceitarTermosSchema = z.object({ aceiteTermos: aceiteTermosSchema });

// Resposta ao modal de boas-vindas do primeiro acesso. Informar o SICAB cria o perfil de
// arteiro vinculado; sem ele a pessoa segue como usuária comum (pode se cadastrar depois).
export const boasVindasSchema = z.object({
  sicab: z
    .string()
    .trim()
    .min(3, 'Número de cadastro muito curto')
    .max(50, 'Número de cadastro muito longo')
    .optional()
    .or(z.literal('').transform(() => undefined)),
});

// Campos da própria conta que o usuário edita no site. O e-mail não entra: trocá-lo exigiria
// uma nova verificação (e hoje ele também é a identidade do login com Google).
export const atualizarContaSchema = z.object({ nome: nomeSchema });

export type CadastroContaInput = z.infer<typeof cadastroContaSchema>;
export type BoasVindasInput = z.infer<typeof boasVindasSchema>;
export type AtualizarContaInput = z.infer<typeof atualizarContaSchema>;
export type LoginContaInput = z.infer<typeof loginContaSchema>;
export type RedefinirSenhaInput = z.infer<typeof redefinirSenhaSchema>;
export type ConcluirCadastroGoogleInput = z.infer<typeof concluirCadastroGoogleSchema>;

export interface ContaUsuario {
  id: string;
  nome: string;
  email: string;
  moderador: boolean;
  arteiroVerificado: boolean;
  // Usuários criados pela Admin ainda não aceitaram os termos: o site pede o aceite no primeiro acesso.
  termosPendentes: boolean;
  // Ainda não respondeu ao modal de boas-vindas ("você é artesã(o)?") do primeiro acesso.
  boasVindasPendentes: boolean;
  arteiros: UsuarioArteiroRef[];
}

export interface ContaSessaoResponse {
  token: string;
  usuario: ContaUsuario;
}

export interface ContaMeResponse {
  usuario: ContaUsuario;
}

// Payload do token temporário do cadastro via Google (antes do aceite dos termos).
export interface CadastroGooglePayload {
  nome: string;
  email: string;
}

// Tela de perfil do site: a conta e, para quem é arteiro, o perfil que ela pode editar.
export interface ContaPerfilResponse {
  usuario: ContaUsuario;
  arteiro: Arteiro | null;
}

// Só os ids, para marcar o coração nos cards sem carregar as peças inteiras.
export interface FavoritosIdsResponse {
  ids: number[];
}

export interface FavoritosResponse {
  items: PublicoPecaResumo[];
}
