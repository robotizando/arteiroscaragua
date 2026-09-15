import { Router } from 'express';
import { requireAdminAuth } from '../../middlewares/require-admin-auth';
import { asyncHandler } from '../../middlewares/error-handler';
import * as controller from './usuarios.controller';

// CRUD de usuários normais (arteiros, moderadores) — uso exclusivo da Admin.
const router = Router();

router.use(requireAdminAuth);

router.get('/', asyncHandler(controller.list));
router.get('/:id', asyncHandler(controller.getById));
router.post('/', asyncHandler(controller.create));
router.patch('/:id', asyncHandler(controller.update));
router.delete('/:id', asyncHandler(controller.remove));
router.put('/:id/arteiros', asyncHandler(controller.setArteiros));

export default router;
