import { Router } from 'express';
import { asyncHandler } from '../../middlewares/error-handler';
import * as controller from './publico.controller';

// Vitrine do site: leitura pública, sem autenticação.
const router = Router();

router.get('/filtros', asyncHandler(controller.getFiltros));
router.get('/materiais', asyncHandler(controller.listMateriais));
router.get('/pecas', asyncHandler(controller.listPecas));
router.get('/pecas/:id', asyncHandler(controller.getPeca));
router.get('/arteiros', asyncHandler(controller.listArteiros));
router.get('/arteiros/:id', asyncHandler(controller.getArteiro));

export default router;
