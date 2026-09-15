import { Router } from 'express';
import multer from 'multer';
import { ARTEIRO_PECA_IMAGEM_MAX_BYTES, ARTEIRO_PECA_IMAGEM_MIME_TYPES, ARTEIRO_PECA_MAX_IMAGENS } from '@arteiroscaragua/shared-types';
import { requireAdminAuth } from '../../middlewares/require-admin-auth';
import { asyncHandler } from '../../middlewares/error-handler';
import * as controller from './pecas.controller';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: ARTEIRO_PECA_IMAGEM_MAX_BYTES, files: ARTEIRO_PECA_MAX_IMAGENS },
  fileFilter: (_req, file, cb) => {
    if (!(ARTEIRO_PECA_IMAGEM_MIME_TYPES as readonly string[]).includes(file.mimetype)) {
      cb(new Error('Formato de imagem não suportado'));
      return;
    }
    cb(null, true);
  },
});

const router = Router({ mergeParams: true });

router.use(requireAdminAuth);

router.get('/', asyncHandler(controller.list));
router.post('/', upload.array('imagens', ARTEIRO_PECA_MAX_IMAGENS), asyncHandler(controller.create));
router.patch('/:pecaId', upload.array('imagens', ARTEIRO_PECA_MAX_IMAGENS), asyncHandler(controller.update));
router.delete('/:pecaId', asyncHandler(controller.remove));
router.delete('/:pecaId/imagens/:imagemId', asyncHandler(controller.removeImagem));

export default router;
