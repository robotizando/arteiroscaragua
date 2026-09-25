import { Router, Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../middlewares/error-handler';
import { mountArteiroChildRoutes } from '../arteiros/arteiro-children.routes';
import { uploadLogotipo } from '../arteiros/uploads';
import type { UsuarioRow } from '../../database/client';
import * as controller from './perfil.controller';
import { usuarioPossuiArteiro } from './perfil.service';

// Edição do perfil de arteiro pelo próprio dono: as rotas são as mesmas da Admin, mas só
// valem para o arteiro vinculado a quem está logado. Montado sob /api/conta/arteiros/:arteiroId,
// depois de requireUsuarioAuth.
async function requireArteiroProprio(req: Request, res: Response, next: NextFunction) {
  const arteiroId = Number(req.params.arteiroId);
  const usuario = req.usuario as UsuarioRow;
  if (!Number.isInteger(arteiroId) || !(await usuarioPossuiArteiro(usuario.id, arteiroId))) {
    // 404 (e não 403) para não confirmar a existência de perfis de outras pessoas.
    return res.status(404).json({ error: 'Perfil de arteiro não encontrado' });
  }
  next();
}

const router = Router({ mergeParams: true });

router.use(asyncHandler(requireArteiroProprio));

router.patch('/', uploadLogotipo, asyncHandler(controller.atualizarArteiro));
router.put('/materiais', asyncHandler(controller.definirMateriais));

mountArteiroChildRoutes(router);

export default router;
