import { Request, Response } from 'express';
import * as service from './publico.service';

function positiveInt(value: unknown): number | undefined {
  const parsed = typeof value === 'string' ? Number(value) : NaN;
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function text(value: unknown, max = 100): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim().slice(0, max) : undefined;
}

export async function listPecas(req: Request, res: Response) {
  const result = await service.listPecas({
    search: text(req.query.search),
    materialId: text(req.query.materialId),
    arteiroId: positiveInt(req.query.arteiroId),
    page: positiveInt(req.query.page),
    pageSize: positiveInt(req.query.pageSize),
  });
  res.json(result);
}

export async function getPeca(req: Request, res: Response) {
  res.json(await service.getPeca(Number(req.params.id)));
}

export async function listArteirosRecentes(req: Request, res: Response) {
  const items = await service.listArteirosRecentes(positiveInt(req.query.limit));
  res.json({ items });
}

export async function getArteiro(req: Request, res: Response) {
  const arteiro = await service.getArteiro(Number(req.params.id));
  res.json({ arteiro });
}

export async function getFiltros(_req: Request, res: Response) {
  res.json(await service.getFiltros());
}
