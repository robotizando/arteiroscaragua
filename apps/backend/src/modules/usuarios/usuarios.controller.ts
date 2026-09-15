import { Request, Response } from 'express';
import {
  createUsuarioSchema,
  setUsuarioArteirosSchema,
  updateUsuarioSchema,
  USUARIO_PAPEIS,
  type UsuarioPapel,
  type UsuarioStatus,
} from '@arteiroscaragua/shared-types';
import * as service from './usuarios.service';

export async function list(req: Request, res: Response) {
  const { search, papel, estado, page, pageSize } = req.query;

  const result = await service.listUsuarios({
    search: typeof search === 'string' ? search : undefined,
    papel: USUARIO_PAPEIS.includes(papel as UsuarioPapel) ? (papel as UsuarioPapel) : undefined,
    estado: typeof estado === 'string' ? (estado as UsuarioStatus) : undefined,
    page: page ? Number(page) : undefined,
    pageSize: pageSize ? Number(pageSize) : undefined,
  });

  res.json(result);
}

export async function getById(req: Request, res: Response) {
  const usuario = await service.getUsuarioById(req.params.id);
  res.json({ usuario });
}

export async function create(req: Request, res: Response) {
  const input = createUsuarioSchema.parse(req.body);
  const usuario = await service.createUsuario(input);
  res.status(201).json({ usuario });
}

export async function update(req: Request, res: Response) {
  const input = updateUsuarioSchema.parse(req.body);
  const usuario = await service.updateUsuario(req.params.id, input);
  res.json({ usuario });
}

export async function remove(req: Request, res: Response) {
  await service.deleteUsuario(req.params.id);
  res.status(204).send();
}

export async function setArteiros(req: Request, res: Response) {
  const input = setUsuarioArteirosSchema.parse(req.body);
  const usuario = await service.setUsuarioArteiros(req.params.id, input);
  res.json({ usuario });
}
