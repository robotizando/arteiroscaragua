import { Router } from 'express';
import { requireAdminAuth } from '../../middlewares/require-admin-auth';
import { asyncHandler } from '../../middlewares/error-handler';
import * as controller from './arteiros.controller';
import * as pecasController from './pecas.controller';
import { mountArteiroChildRoutes } from './arteiro-children.routes';
import { uploadLogotipo } from './uploads';

const router = Router();

router.get('/:id/logotipo', asyncHandler(controller.getLogotipo));
router.get('/pecas/imagens/:imagemId', asyncHandler(pecasController.getImagem));

router.use(requireAdminAuth);

router.get('/', asyncHandler(controller.list));
router.get('/:id', asyncHandler(controller.getById));
router.post('/', uploadLogotipo, asyncHandler(controller.create));
router.patch('/:id', uploadLogotipo, asyncHandler(controller.update));
router.delete('/:id', asyncHandler(controller.remove));
router.put('/:id/materiais', asyncHandler(controller.setMateriais));

mountArteiroChildRoutes(router, '/:arteiroId');

export default router;
