import { Router } from 'express';
import { asyncHandler } from '../../middlewares/error-handler';
import * as controller from './pecas.controller';
import { uploadPecaImagens } from './uploads';

// Montado sob /:arteiroId/pecas pela Admin e pelo perfil do próprio arteiro no site:
// a autenticação (e, no site, a checagem de que o arteiro é o da pessoa) fica no router pai.
const router = Router({ mergeParams: true });

router.get('/', asyncHandler(controller.list));
router.post('/', uploadPecaImagens, asyncHandler(controller.create));
router.patch('/:pecaId', uploadPecaImagens, asyncHandler(controller.update));
router.delete('/:pecaId', asyncHandler(controller.remove));
router.delete('/:pecaId/imagens/:imagemId', asyncHandler(controller.removeImagem));

export default router;
