import { Request, Response } from 'express';
import {
  aceitarTermosSchema,
  cadastroContaSchema,
  concluirCadastroGoogleSchema,
  emailContaSchema,
  loginContaSchema,
  redefinirSenhaSchema,
  tokenContaSchema,
  type ContaErroCodigo,
} from '@arteiroscaragua/shared-types';
import { config } from '../../config';
import type { UsuarioRow } from '../../database/client';
import { AppError } from '../../middlewares/error-handler';
import * as service from './conta.service';

export async function cadastro(req: Request, res: Response) {
  await service.cadastrar(cadastroContaSchema.parse(req.body));
  res.status(201).json({ ok: true });
}

export async function verificarEmail(req: Request, res: Response) {
  const { token } = tokenContaSchema.parse(req.body);
  await service.verificarEmail(req, token);
  res.json({ ok: true });
}

export async function reenviarVerificacao(req: Request, res: Response) {
  const { email } = emailContaSchema.parse(req.body);
  await service.reenviarVerificacao(email);
  res.json({ ok: true });
}

export async function login(req: Request, res: Response) {
  const sessao = await service.login(req, loginContaSchema.parse(req.body));
  res.json(sessao);
}

export async function esqueciSenha(req: Request, res: Response) {
  const { email } = emailContaSchema.parse(req.body);
  await service.esqueciSenha(email);
  res.json({ ok: true });
}

export async function redefinirSenha(req: Request, res: Response) {
  await service.redefinirSenha(req, redefinirSenhaSchema.parse(req.body));
  res.json({ ok: true });
}

export async function concluirCadastroGoogle(req: Request, res: Response) {
  const sessao = await service.concluirCadastroGoogle(req, concluirCadastroGoogleSchema.parse(req.body));
  res.status(201).json(sessao);
}

export async function me(req: Request, res: Response) {
  const usuario = await service.toContaUsuario(req.usuario as UsuarioRow);
  res.json({ usuario });
}

export async function aceitarTermos(req: Request, res: Response) {
  aceitarTermosSchema.parse(req.body);
  const usuario = await service.aceitarTermos(req.usuario as UsuarioRow);
  res.json({ usuario });
}

// Os tokens vão no fragmento (#), que o navegador não envia ao servidor do site nem registra em logs.
function redirecionarSite(res: Response, path: string, token: string) {
  const url = new URL(path, config.siteUrl);
  url.hash = new URLSearchParams({ token }).toString();
  res.redirect(url.toString());
}

export function redirecionarErroGoogle(res: Response, codigo: ContaErroCodigo) {
  const url = new URL('/entrar', config.siteUrl);
  url.searchParams.set('erro', codigo);
  res.redirect(url.toString());
}

export async function googleCallback(req: Request, res: Response, perfil: service.GoogleSitePerfil) {
  try {
    const resultado = await service.entrarComGoogle(req, perfil);
    if (resultado.tipo === 'cadastro') {
      redirecionarSite(res, '/cadastro/google', resultado.tokenCadastro);
    } else {
      redirecionarSite(res, '/auth/callback', resultado.token);
    }
  } catch (error) {
    if (error instanceof AppError && error.codigo) {
      redirecionarErroGoogle(res, error.codigo as ContaErroCodigo);
      return;
    }
    throw error;
  }
}
