import { Request, Response } from 'express';
import {
  createArteiroSchema,
  setArteiroMateriaisSchema,
  updateArteiroSchema,
  type ArteiroStatus,
} from '@arteiroscaragua/shared-types';
import { AppError } from '../../middlewares/error-handler';
import * as service from './arteiros.service';

function extractLogotipo(req: Request): service.LogotipoFile | undefined {
  if (!req.file) return undefined;
  return { buffer: req.file.buffer, mimeType: req.file.mimetype };
}

export async function list(req: Request, res: Response) {
  const { search, estado, page, pageSize } = req.query;

  const result = await service.listArteiros({
    search: typeof search === 'string' ? search : undefined,
    estado: typeof estado === 'string' ? (estado as ArteiroStatus) : undefined,
    page: page ? Number(page) : undefined,
    pageSize: pageSize ? Number(pageSize) : undefined,
  });

  res.json(result);
}

export async function getById(req: Request, res: Response) {
  const arteiro = await service.getArteiroById(Number(req.params.id));
  res.json({ arteiro });
}

export async function create(req: Request, res: Response) {
  const input = createArteiroSchema.parse(req.body);
  const arteiro = await service.createArteiro(input, extractLogotipo(req));
  res.status(201).json({ arteiro });
}

export async function update(req: Request, res: Response) {
  const input = updateArteiroSchema.parse(req.body);
  const arteiro = await service.updateArteiro(Number(req.params.id), input, extractLogotipo(req));
  res.json({ arteiro });
}

export async function remove(req: Request, res: Response) {
  await service.deleteArteiro(Number(req.params.id));
  res.status(204).send();
}

export async function getLogotipo(req: Request, res: Response) {
  const logotipo = await service.getArteiroLogotipo(Number(req.params.id));
  if (!logotipo) {
    throw new AppError('Logotipo não encontrado', 404);
  }
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  res.contentType(logotipo.mimeType);
  res.send(logotipo.buffer);
}

export async function setMateriais(req: Request, res: Response) {
  const input = setArteiroMateriaisSchema.parse(req.body);
  await service.setArteiroMateriais(Number(req.params.id), input);
  res.status(204).send();
}
