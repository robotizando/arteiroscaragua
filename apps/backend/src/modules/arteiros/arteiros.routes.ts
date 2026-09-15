import { Router } from 'express';
import multer from 'multer';
import {
  ARTEIRO_LOGOTIPO_MAX_BYTES,
  ARTEIRO_LOGOTIPO_MIME_TYPES,
  createArteiroCursoSchema,
  createArteiroEventoSchema,
  createArteiroPremioSchema,
  createArteiroProjetoSchema,
  createArteiroVideoSchema,
  updateArteiroCursoSchema,
  updateArteiroEventoSchema,
  updateArteiroPremioSchema,
  updateArteiroProjetoSchema,
  updateArteiroVideoSchema,
} from '@arteiroscaragua/shared-types';
import { arteiroCursos, arteiroEventos, arteiroPremios, arteiroProjetos, arteiroVideos } from '../../database/client';
import { requireAdminAuth } from '../../middlewares/require-admin-auth';
import { asyncHandler } from '../../middlewares/error-handler';
import * as controller from './arteiros.controller';
import * as pecasController from './pecas.controller';
import pecasRoutes from './pecas.routes';
import { createChildCollectionRouter } from './child-collection';
import {
  toArteiroCursoDTO,
  toArteiroEventoDTO,
  toArteiroPremioDTO,
  toArteiroProjetoDTO,
  toArteiroVideoDTO,
} from './arteiros.mapper';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: ARTEIRO_LOGOTIPO_MAX_BYTES },
  fileFilter: (_req, file, cb) => {
    if (!(ARTEIRO_LOGOTIPO_MIME_TYPES as readonly string[]).includes(file.mimetype)) {
      cb(new Error('Formato de imagem não suportado'));
      return;
    }
    cb(null, true);
  },
});

const router = Router();

router.get('/:id/logotipo', asyncHandler(controller.getLogotipo));
router.get('/pecas/imagens/:imagemId', asyncHandler(pecasController.getImagem));

router.use(requireAdminAuth);

router.get('/', asyncHandler(controller.list));
router.get('/:id', asyncHandler(controller.getById));
router.post('/', upload.single('logotipo'), asyncHandler(controller.create));
router.patch('/:id', upload.single('logotipo'), asyncHandler(controller.update));
router.delete('/:id', asyncHandler(controller.remove));
router.put('/:id/materiais', asyncHandler(controller.setMateriais));

router.use('/:arteiroId/pecas', pecasRoutes);

router.use(
  '/:arteiroId/premios',
  createChildCollectionRouter({
    table: arteiroPremios,
    createSchema: createArteiroPremioSchema,
    updateSchema: updateArteiroPremioSchema,
    toDTO: toArteiroPremioDTO,
    notFoundMessage: 'Prêmio não encontrado',
  }),
);

router.use(
  '/:arteiroId/videos',
  createChildCollectionRouter({
    table: arteiroVideos,
    createSchema: createArteiroVideoSchema,
    updateSchema: updateArteiroVideoSchema,
    toDTO: toArteiroVideoDTO,
    notFoundMessage: 'Vídeo não encontrado',
  }),
);

router.use(
  '/:arteiroId/eventos',
  createChildCollectionRouter({
    table: arteiroEventos,
    createSchema: createArteiroEventoSchema,
    updateSchema: updateArteiroEventoSchema,
    toDTO: toArteiroEventoDTO,
    notFoundMessage: 'Evento não encontrado',
  }),
);

router.use(
  '/:arteiroId/cursos',
  createChildCollectionRouter({
    table: arteiroCursos,
    createSchema: createArteiroCursoSchema,
    updateSchema: updateArteiroCursoSchema,
    toDTO: toArteiroCursoDTO,
    notFoundMessage: 'Curso não encontrado',
  }),
);

router.use(
  '/:arteiroId/projetos',
  createChildCollectionRouter({
    table: arteiroProjetos,
    createSchema: createArteiroProjetoSchema,
    updateSchema: updateArteiroProjetoSchema,
    toDTO: toArteiroProjetoDTO,
    notFoundMessage: 'Projeto não encontrado',
  }),
);

export default router;
