import { Router } from 'express';
import { requireAdminAuth } from '../../middlewares/require-admin-auth';
import { asyncHandler } from '../../middlewares/error-handler';
import * as controller from './acessos.controller';

const router = Router();

router.use(requireAdminAuth);

router.get('/', asyncHandler(controller.list));

export default router;
