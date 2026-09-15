import type { Request } from 'express';
import { eq } from 'drizzle-orm';
import {
  RECUPERACAO_SENHA_VALIDADE_MS,
  VERIFICACAO_EMAIL_VALIDADE_MS,
  type AcessoMetodo,
  type CadastroContaInput,
  type ConcluirCadastroGoogleInput,
  type ContaErroCodigo,
  type ContaSessaoResponse,
  type ContaUsuario,
  type LoginContaInput,
  type RedefinirSenhaInput,
} from '@arteiroscaragua/shared-types';
import { config } from '../../config';
import { arteiros, db, usuarioArteiros, usuarios, type UsuarioRow } from '../../database/client';
import { AppError } from '../../middlewares/error-handler';
import { registrarAcesso } from '../acessos/acessos.service';
import { enviarEmail, type EmailMensagem } from '../email/email.service';
import * as templates from '../email/templates';
import { compararSenha, hashSenha } from '../usuarios/senha';
import { loadArteiroRefs } from '../usuarios/usuarios.service';
import { signCadastroGoogleToken, signUsuarioToken, verifyCadastroGoogleToken } from './jwt';
import { consumirToken, gerarToken } from './tokens.service';

export interface GoogleSitePerfil {
  googleId: string;
  email: string | null;
  emailVerificado: boolean;
  nome: string;
}

export type GoogleLoginResultado = { tipo: 'sessao'; token: string } | { tipo: 'cadastro'; tokenCadastro: string };

const MENSAGEM_CREDENCIAIS = 'E-mail ou senha inválidos';

async function findByEmail(email: string) {
  // Inclui excluídos: o índice único de e-mail continua valendo para eles.
  const [row] = await db.select().from(usuarios).where(eq(usuarios.email, email));
  return row;
}

function podeEntrar(row: UsuarioRow): boolean {
  return !row.deletedAt && row.estado === 'ativo';
}

// Hash usado quando o e-mail não existe, para o tempo de resposta do login não denunciar isso.
let hashFicticio: Promise<string> | undefined;
function getHashFicticio() {
  hashFicticio ??= hashSenha('Senha-ficticia-0');
  return hashFicticio;
}

function siteLink(path: string, token?: string): string {
  const url = new URL(path, config.siteUrl);
  if (token) url.searchParams.set('token', token);
  return url.toString();
}

// Falha no envio não pode derrubar o fluxo nem revelar nada ao cliente; fica só no log do servidor.
async function enviarSemFalhar(mensagem: EmailMensagem) {
  try {
    await enviarEmail(mensagem);
  } catch (error) {
    console.error('[EMAIL] Falha ao enviar e-mail:', error);
  }
}

async function falharAcesso(
  req: Request,
  dados: { metodo: AcessoMetodo; motivo: string; email?: string | null; usuarioId?: string | null },
  erro: { mensagem: string; status: number; codigo: ContaErroCodigo },
): Promise<never> {
  await registrarAcesso(req, { ator: 'usuario', sucesso: false, ...dados });
  throw new AppError(erro.mensagem, erro.status, erro.codigo);
}

export async function toContaUsuario(row: UsuarioRow): Promise<ContaUsuario> {
  const refs = await loadArteiroRefs([row.id]);
  return {
    id: row.id,
    nome: row.nome,
    email: row.email,
    moderador: row.moderador,
    arteiroVerificado: row.arteiroVerificado,
    termosPendentes: !row.termosAceitosEm,
    arteiros: refs.get(row.id) ?? [],
  };
}

async function abrirSessao(req: Request, row: UsuarioRow, metodo: AcessoMetodo): Promise<ContaSessaoResponse> {
  const [atualizado] = await db
    .update(usuarios)
    .set({ ultimoLoginEm: new Date() })
    .where(eq(usuarios.id, row.id))
    .returning();
  await registrarAcesso(req, { ator: 'usuario', metodo, sucesso: true, email: row.email, usuarioId: row.id });
  return { token: signUsuarioToken(row.id), usuario: await toContaUsuario(atualizado) };
}

// Auto-cadastro: cria usuário, perfil de arteiro com o mesmo nome e o vínculo, numa transação.
function criarUsuarioArteiro(values: {
  nome: string;
  email: string;
  senhaHash?: string;
  googleId?: string;
  emailVerificadoEm?: Date;
}): UsuarioRow {
  return db.transaction((tx) => {
    const usuario = tx
      .insert(usuarios)
      .values({
        nome: values.nome,
        email: values.email,
        senhaHash: values.senhaHash ?? null,
        googleId: values.googleId ?? null,
        emailVerificadoEm: values.emailVerificadoEm ?? null,
        termosAceitosEm: new Date(),
      })
      .returning()
      .get();
    const arteiro = tx.insert(arteiros).values({ nome: values.nome }).returning({ id: arteiros.id }).get();
    tx.insert(usuarioArteiros).values({ usuarioId: usuario.id, arteiroId: arteiro.id }).run();
    return usuario;
  });
}

function enviarVerificacao(row: UsuarioRow) {
  const token = gerarToken(row.id, 'verificacao_email', VERIFICACAO_EMAIL_VALIDADE_MS);
  return enviarSemFalhar(
    templates.verificacaoEmail({ para: row.email, nome: row.nome, link: siteLink('/verificar-email', token) }),
  );
}

// A resposta é sempre a mesma (201), exista ou não conta com o e-mail; quem já tem conta
// recebe um e-mail avisando. O hash é calculado antes da busca para igualar o tempo de resposta.
export async function cadastrar(input: CadastroContaInput): Promise<void> {
  const senhaHash = await hashSenha(input.senha);
  const existente = await findByEmail(input.email);

  if (existente) {
    if (!podeEntrar(existente)) return;
    if (!existente.emailVerificadoEm && existente.senhaHash) {
      await enviarVerificacao(existente);
      return;
    }
    await enviarSemFalhar(
      templates.contaExistente({
        para: existente.email,
        nome: existente.nome,
        linkEntrar: siteLink('/entrar'),
        linkEsqueciSenha: siteLink('/esqueci-senha'),
      }),
    );
    return;
  }

  const usuario = criarUsuarioArteiro({ nome: input.nome, email: input.email, senhaHash });
  await enviarVerificacao(usuario);
}

export async function verificarEmail(req: Request, token: string): Promise<void> {
  const usuarioId = consumirToken(token, 'verificacao_email');
  if (!usuarioId) {
    await falharAcesso(
      req,
      { metodo: 'senha', motivo: 'verificacao_token_invalido' },
      { mensagem: 'Link de confirmação inválido ou expirado', status: 400, codigo: 'token_invalido' },
    );
  }

  const [row] = await db.select().from(usuarios).where(eq(usuarios.id, usuarioId!));
  if (!row.emailVerificadoEm) {
    await db.update(usuarios).set({ emailVerificadoEm: new Date(), updatedAt: new Date() }).where(eq(usuarios.id, row.id));
  }
}

export async function reenviarVerificacao(email: string): Promise<void> {
  const row = await findByEmail(email);
  if (row && podeEntrar(row) && !row.emailVerificadoEm && row.senhaHash) {
    await enviarVerificacao(row);
  }
}

export async function login(req: Request, input: LoginContaInput): Promise<ContaSessaoResponse> {
  const row = await findByEmail(input.email);
  const existe = row && !row.deletedAt;
  const senhaOk = await compararSenha(input.senha, existe && row.senhaHash ? row.senhaHash : await getHashFicticio());

  const falhar = (motivo: string, codigo: ContaErroCodigo, mensagem: string, status: number) =>
    falharAcesso(
      req,
      { metodo: 'senha', motivo, email: input.email, usuarioId: existe ? row.id : null },
      { mensagem, status, codigo },
    );

  if (!existe) return falhar('usuario_inexistente', 'credenciais_invalidas', MENSAGEM_CREDENCIAIS, 401);
  if (!row.senhaHash) return falhar('sem_senha', 'credenciais_invalidas', MENSAGEM_CREDENCIAIS, 401);
  if (!senhaOk) return falhar('senha_invalida', 'credenciais_invalidas', MENSAGEM_CREDENCIAIS, 401);
  if (row.estado !== 'ativo') {
    return falhar('bloqueado', 'bloqueado', 'Sua conta está bloqueada. Fale com a equipe do Arteiros Caragua.', 403);
  }
  if (!row.emailVerificadoEm) {
    return falhar(
      'email_nao_verificado',
      'email_nao_verificado',
      'Confirme seu e-mail antes de entrar. Enviamos um link para a sua caixa de entrada.',
      403,
    );
  }

  return abrirSessao(req, row, 'senha');
}

export async function esqueciSenha(email: string): Promise<void> {
  const row = await findByEmail(email);
  if (!row || !podeEntrar(row)) return;

  const token = gerarToken(row.id, 'recuperacao_senha', RECUPERACAO_SENHA_VALIDADE_MS);
  await enviarSemFalhar(
    templates.recuperacaoSenha({ para: row.email, nome: row.nome, link: siteLink('/redefinir-senha', token) }),
  );
}

export async function redefinirSenha(req: Request, input: RedefinirSenhaInput): Promise<void> {
  const senhaHash = await hashSenha(input.senha);
  const usuarioId = consumirToken(input.token, 'recuperacao_senha');
  if (!usuarioId) {
    await falharAcesso(
      req,
      { metodo: 'senha', motivo: 'recuperacao_token_invalido' },
      { mensagem: 'Link de redefinição inválido ou expirado. Peça um novo.', status: 400, codigo: 'token_invalido' },
    );
  }

  const [row] = await db.select().from(usuarios).where(eq(usuarios.id, usuarioId!));
  const agora = new Date();
  await db
    .update(usuarios)
    .set({
      senhaHash,
      senhaAlteradaEm: agora,
      // Quem abriu o link do e-mail comprovou ser dono dele.
      emailVerificadoEm: row.emailVerificadoEm ?? agora,
      updatedAt: agora,
    })
    .where(eq(usuarios.id, row.id));
}

export async function entrarComGoogle(req: Request, perfil: GoogleSitePerfil): Promise<GoogleLoginResultado> {
  const falhar = (motivo: string, codigo: ContaErroCodigo, usuarioId?: string) =>
    falharAcesso(
      req,
      { metodo: 'google', motivo, email: perfil.email, usuarioId },
      { mensagem: motivo, status: 403, codigo },
    );

  if (!perfil.email) return falhar('no_email', 'google_sem_email');
  if (!perfil.emailVerificado) return falhar('email_nao_verificado', 'google_email_nao_verificado');
  const email = perfil.email.toLowerCase();

  let [row] = await db.select().from(usuarios).where(eq(usuarios.googleId, perfil.googleId));

  if (!row) {
    row = await findByEmail(email);
    if (!row) {
      return {
        tipo: 'cadastro',
        tokenCadastro: signCadastroGoogleToken({ googleId: perfil.googleId, email, nome: perfil.nome }),
      };
    }

    if (podeEntrar(row)) {
      if (row.googleId && row.googleId !== perfil.googleId) {
        return falhar('google_conflito', 'google_conflito', row.id);
      }
      // O Google garante que a pessoa é dona do e-mail. Se a conta nunca foi verificada, a senha
      // pode ter sido definida por outra pessoa, então ela é descartada ao vincular o Google.
      [row] = await db
        .update(usuarios)
        .set({
          googleId: perfil.googleId,
          emailVerificadoEm: row.emailVerificadoEm ?? new Date(),
          ...(row.emailVerificadoEm ? {} : { senhaHash: null }),
          updatedAt: new Date(),
        })
        .where(eq(usuarios.id, row.id))
        .returning();
    }
  }

  if (!podeEntrar(row)) return falhar('bloqueado', 'bloqueado', row.id);

  const sessao = await abrirSessao(req, row, 'google');
  return { tipo: 'sessao', token: sessao.token };
}

export async function concluirCadastroGoogle(
  req: Request,
  input: ConcluirCadastroGoogleInput,
): Promise<ContaSessaoResponse> {
  let dados;
  try {
    dados = verifyCadastroGoogleToken(input.tokenCadastro);
  } catch {
    throw new AppError(
      'O tempo para concluir o cadastro acabou. Entre com o Google novamente.',
      400,
      'cadastro_expirado',
    );
  }

  const [porGoogle] = await db.select({ id: usuarios.id }).from(usuarios).where(eq(usuarios.googleId, dados.googleId));
  if (porGoogle || (await findByEmail(dados.email))) {
    throw new AppError('Já existe uma conta com este e-mail. Entre com o Google novamente.', 409, 'email_em_uso');
  }

  const row = criarUsuarioArteiro({
    nome: dados.nome,
    email: dados.email,
    googleId: dados.googleId,
    emailVerificadoEm: new Date(),
  });
  return abrirSessao(req, row, 'google');
}

export async function aceitarTermos(row: UsuarioRow): Promise<ContaUsuario> {
  const [atualizado] = await db
    .update(usuarios)
    .set({ termosAceitosEm: row.termosAceitosEm ?? new Date(), updatedAt: new Date() })
    .where(eq(usuarios.id, row.id))
    .returning();
  return toContaUsuario(atualizado);
}
