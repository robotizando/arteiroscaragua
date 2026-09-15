import { Request, Response } from 'express';
import {
  createMaterialSchema,
  updateMaterialSchema,
  type MaterialStatus,
} from '@arteiroscaragua/shared-types';
import { AppError } from '../../middlewares/error-handler';
import * as service from './materiais.service';

function extractThumbnail(req: Request): service.ThumbnailFile | undefined {
  if (!req.file) return undefined;
  return { buffer: req.file.buffer, mimeType: req.file.mimetype };
}

export async function list(req: Request, res: Response) {
  const { search, estado, page, pageSize } = req.query;

  const result = await service.listMateriais({
    search: typeof search === 'string' ? search : undefined,
    estado: typeof estado === 'string' ? (estado as MaterialStatus) : undefined,
    page: page ? Number(page) : undefined,
    pageSize: pageSize ? Number(pageSize) : undefined,
  });

  res.json(result);
}

export async function getById(req: Request, res: Response) {
  const material = await service.getMaterialById(req.params.id);
  res.json({ material });
}

export async function create(req: Request, res: Response) {
  const input = createMaterialSchema.parse(req.body);
  const material = await service.createMaterial(input, extractThumbnail(req));
  res.status(201).json({ material });
}

export async function update(req: Request, res: Response) {
  const input = updateMaterialSchema.parse(req.body);
  const material = await service.updateMaterial(req.params.id, input, extractThumbnail(req));
  res.json({ material });
}

export async function remove(req: Request, res: Response) {
  await service.deleteMaterial(req.params.id);
  res.status(204).send();
}

export async function getThumbnail(req: Request, res: Response) {
  const thumbnail = await service.getMaterialThumbnail(req.params.id);
  if (!thumbnail) {
    throw new AppError('Thumbnail não encontrada', 404);
  }
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  res.contentType(thumbnail.mimeType);
  res.send(thumbnail.buffer);
}
