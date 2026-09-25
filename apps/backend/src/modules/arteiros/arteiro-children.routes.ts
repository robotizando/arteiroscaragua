import { Router } from 'express';
import {
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
import { createChildCollectionRouter } from './child-collection';
import pecasRoutes from './pecas.routes';
import {
  toArteiroCursoDTO,
  toArteiroEventoDTO,
  toArteiroPremioDTO,
  toArteiroProjetoDTO,
  toArteiroVideoDTO,
} from './arteiros.mapper';

// Coleções filhas de um arteiro (peças, prêmios, vídeos, eventos, cursos e projetos).
// As mesmas rotas servem à Admin (/api/arteiros/:arteiroId/...) e ao perfil do próprio
// arteiro no site (/api/conta/arteiros/:arteiroId/...); a autenticação é de quem monta.
const COLECOES: { path: string; router: Router }[] = [
  { path: 'pecas', router: pecasRoutes },
  {
    path: 'premios',
    router: createChildCollectionRouter({
      table: arteiroPremios,
      createSchema: createArteiroPremioSchema,
      updateSchema: updateArteiroPremioSchema,
      toDTO: toArteiroPremioDTO,
      notFoundMessage: 'Prêmio não encontrado',
    }),
  },
  {
    path: 'videos',
    router: createChildCollectionRouter({
      table: arteiroVideos,
      createSchema: createArteiroVideoSchema,
      updateSchema: updateArteiroVideoSchema,
      toDTO: toArteiroVideoDTO,
      notFoundMessage: 'Vídeo não encontrado',
    }),
  },
  {
    path: 'eventos',
    router: createChildCollectionRouter({
      table: arteiroEventos,
      createSchema: createArteiroEventoSchema,
      updateSchema: updateArteiroEventoSchema,
      toDTO: toArteiroEventoDTO,
      notFoundMessage: 'Evento não encontrado',
    }),
  },
  {
    path: 'cursos',
    router: createChildCollectionRouter({
      table: arteiroCursos,
      createSchema: createArteiroCursoSchema,
      updateSchema: updateArteiroCursoSchema,
      toDTO: toArteiroCursoDTO,
      notFoundMessage: 'Curso não encontrado',
    }),
  },
  {
    path: 'projetos',
    router: createChildCollectionRouter({
      table: arteiroProjetos,
      createSchema: createArteiroProjetoSchema,
      updateSchema: updateArteiroProjetoSchema,
      toDTO: toArteiroProjetoDTO,
      notFoundMessage: 'Projeto não encontrado',
    }),
  },
];

// `prefixo` traz o :arteiroId quando o router pai ainda não o consumiu (caso da Admin).
export function mountArteiroChildRoutes(router: Router, prefixo = '') {
  for (const { path, router: child } of COLECOES) {
    router.use(`${prefixo}/${path}`, child);
  }
}
