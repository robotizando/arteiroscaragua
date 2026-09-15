import { Router } from 'express';
import multer from 'multer';
import { MATERIAL_THUMBNAIL_MAX_BYTES, MATERIAL_THUMBNAIL_MIME_TYPES } from '@arteiroscaragua/shared-types';
import { requireAdminAuth } from '../../middlewares/require-admin-auth';
import { asyncHandler } from '../../middlewares/error-handler';
import * as controller from './materiais.controller';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MATERIAL_THUMBNAIL_MAX_BYTES },
  fileFilter: (_req, file, cb) => {
    if (!(MATERIAL_THUMBNAIL_MIME_TYPES as readonly string[]).includes(file.mimetype)) {
      cb(new Error('Formato de imagem não suportado'));
      return;
    }
    cb(null, true);
  },
});

const router = Router();

router.get('/:id/thumbnail', asyncHandler(controller.getThumbnail));

router.use(requireAdminAuth);

router.get('/', asyncHandler(controller.list));
router.get('/:id', asyncHandler(controller.getById));
router.post('/', upload.single('thumbnail'), asyncHandler(controller.create));
router.patch('/:id', upload.single('thumbnail'), asyncHandler(controller.update));
router.delete('/:id', asyncHandler(controller.remove));

export default router;
