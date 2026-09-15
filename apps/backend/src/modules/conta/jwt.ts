import jwt from 'jsonwebtoken';
import { config } from '../../config';

// Tokens do site usam segredo próprio (config.usuarioJwt) e audiences distintas, para que o
// token de cadastro pendente não sirva como sessão e nenhum deles valha na Admin.
const AUD_SESSAO = 'site';
const AUD_CADASTRO_GOOGLE = 'site-cadastro-google';
const CADASTRO_GOOGLE_VALIDADE = '15m';

export interface UsuarioSessaoPayload {
  sub: string;
  iat: number;
}

export interface CadastroGoogleTokenPayload {
  googleId: string;
  email: string;
  nome: string;
}

export function signUsuarioToken(usuarioId: string): string {
  return jwt.sign({}, config.usuarioJwt.secret, {
    subject: usuarioId,
    audience: AUD_SESSAO,
    expiresIn: config.usuarioJwt.expiresIn,
  } as jwt.SignOptions);
}

export function verifyUsuarioToken(token: string): UsuarioSessaoPayload {
  const payload = jwt.verify(token, config.usuarioJwt.secret, { audience: AUD_SESSAO }) as jwt.JwtPayload;
  if (!payload.sub || typeof payload.iat !== 'number') {
    throw new Error('Token inválido');
  }
  return { sub: payload.sub, iat: payload.iat };
}

export function signCadastroGoogleToken(payload: CadastroGoogleTokenPayload): string {
  return jwt.sign(payload, config.usuarioJwt.secret, {
    audience: AUD_CADASTRO_GOOGLE,
    expiresIn: CADASTRO_GOOGLE_VALIDADE,
  });
}

export function verifyCadastroGoogleToken(token: string): CadastroGoogleTokenPayload {
  const payload = jwt.verify(token, config.usuarioJwt.secret, {
    audience: AUD_CADASTRO_GOOGLE,
  }) as jwt.JwtPayload & Partial<CadastroGoogleTokenPayload>;
  if (!payload.googleId || !payload.email || !payload.nome) {
    throw new Error('Token inválido');
  }
  return { googleId: payload.googleId, email: payload.email, nome: payload.nome };
}
