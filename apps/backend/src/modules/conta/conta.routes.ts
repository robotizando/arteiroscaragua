import { Router, Request, Response, NextFunction } from 'express';
import { rateLimit, ipKeyGenerator } from 'express-rate-limit';
import passport, { GOOGLE_SITE_STRATEGY } from '../../config/passport';
import { isGoogleOAuthConfigured } from '../../config';
import { asyncHandler } from '../../middlewares/error-handler';
import { requireUsuarioAuth } from '../../middlewares/require-usuario-auth';
import { registrarAcesso } from '../acessos/acessos.service';
import type { GoogleSitePerfil } from './conta.service';
import * as controller from './conta.controller';

const QUINZE_MINUTOS = 15 * 60 * 1000;

function limite(limit: number, porEmail = false) {
  return rateLimit({
    windowMs: QUINZE_MINUTOS,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    // Por e-mail, a contagem é da conta-alvo (independe do IP de quem tenta).
    keyGenerator: (req) => {
      const email = porEmail && typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
      return email ? `email:${email}` : ipKeyGenerator(req.ip ?? '');
    },
    message: { error: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.' },
  });
}

const limitePorIp = limite(30);
const limitePorEmail = limite(8, true);

const router = Router();

router.post('/cadastro', limitePorIp, limitePorEmail, asyncHandler(controller.cadastro));
router.post('/verificar-email', limitePorIp, asyncHandler(controller.verificarEmail));
router.post('/reenviar-verificacao', limitePorIp, limitePorEmail, asyncHandler(controller.reenviarVerificacao));
router.post('/login', limitePorIp, limitePorEmail, asyncHandler(controller.login));
router.post('/esqueci-senha', limitePorIp, limitePorEmail, asyncHandler(controller.esqueciSenha));
router.post('/redefinir-senha', limitePorIp, asyncHandler(controller.redefinirSenha));

function ensureGoogleConfigured(_req: Request, res: Response, next: NextFunction) {
  if (!isGoogleOAuthConfigured()) {
    controller.redirecionarErroGoogle(res, 'google_indisponivel');
    return;
  }
  next();
}

router.get(
  '/google',
  ensureGoogleConfigured,
  passport.authenticate(GOOGLE_SITE_STRATEGY, { scope: ['profile', 'email'], session: false }),
);

router.get('/google/callback', ensureGoogleConfigured, (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate(GOOGLE_SITE_STRATEGY, { session: false }, (err: Error | null, perfil: GoogleSitePerfil | false) => {
    if (err || !perfil) {
      // Inclui o caso de a pessoa cancelar na tela do Google.
      if (err) console.error('[GOOGLE SITE]', err);
      return registrarAcesso(req, { ator: 'usuario', metodo: 'google', sucesso: false, motivo: 'auth_failed' }).then(
        () => controller.redirecionarErroGoogle(res, 'google_falhou'),
      );
    }
    return controller.googleCallback(req, res, perfil).catch(next);
  })(req, res, next);
});

router.post('/google/concluir-cadastro', limitePorIp, asyncHandler(controller.concluirCadastroGoogle));

router.get('/me', requireUsuarioAuth, asyncHandler(controller.me));
router.post('/aceitar-termos', requireUsuarioAuth, asyncHandler(controller.aceitarTermos));

export default router;
