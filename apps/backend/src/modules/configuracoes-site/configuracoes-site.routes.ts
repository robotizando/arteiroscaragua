import { Router } from 'express';
import multer from 'multer';
import {
  CONFIGURACAO_SITE_CAPA_MAX_BYTES,
  CONFIGURACAO_SITE_CAPA_MIME_TYPES,
  CONFIGURACAO_SITE_LOGOTIPO_MIME_TYPES,
} from '@arteiroscaragua/shared-types';
import { requireAdminAuth } from '../../middlewares/require-admin-auth';
import { asyncHandler } from '../../middlewares/error-handler';
import * as controller from './configuracoes-site.controller';

const MIME_TYPES_POR_CAMPO: Record<string, readonly string[]> = {
  capa: CONFIGURACAO_SITE_CAPA_MIME_TYPES,
  logotipo: CONFIGURACAO_SITE_LOGOTIPO_MIME_TYPES,
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: CONFIGURACAO_SITE_CAPA_MAX_BYTES },
  fileFilter: (_req, file, cb) => {
    if (!MIME_TYPES_POR_CAMPO[file.fieldname]?.includes(file.mimetype)) {
      cb(new Error('Formato de imagem não suportado'));
      return;
    }
    cb(null, true);
  },
});

const router = Router();

// Leitura pública: o site exibe logotipo, capa, termos, política e "quem somos".
router.get('/', asyncHandler(controller.get));
router.get('/capa', asyncHandler(controller.getCapa));
router.get('/logotipo', asyncHandler(controller.getLogotipo));

router.use(requireAdminAuth);

router.patch(
  '/',
  upload.fields([
    { name: 'capa', maxCount: 1 },
    { name: 'logotipo', maxCount: 1 },
  ]),
  asyncHandler(controller.update),
);

export default router;
