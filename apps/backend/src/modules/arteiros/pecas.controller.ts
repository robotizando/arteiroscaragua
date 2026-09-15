import { Request, Response } from 'express';
import { createArteiroPecaSchema, updateArteiroPecaSchema } from '@arteiroscaragua/shared-types';
import { AppError } from '../../middlewares/error-handler';
import * as service from './pecas.service';

function extractImagens(req: Request): service.ImagemFile[] {
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  return files.map((file) => ({ buffer: file.buffer, mimeType: file.mimetype }));
}

export async function list(req: Request, res: Response) {
  const items = await service.listPecas(Number(req.params.arteiroId));
  res.json({ items });
}

export async function create(req: Request, res: Response) {
  const input = createArteiroPecaSchema.parse(req.body);
  const peca = await service.createPeca(Number(req.params.arteiroId), input, extractImagens(req));
  res.status(201).json({ item: peca });
}

export async function update(req: Request, res: Response) {
  const input = updateArteiroPecaSchema.parse(req.body);
  const peca = await service.updatePeca(
    Number(req.params.arteiroId),
    Number(req.params.pecaId),
    input,
    extractImagens(req),
  );
  res.json({ item: peca });
}

export async function remove(req: Request, res: Response) {
  await service.deletePeca(Number(req.params.arteiroId), Number(req.params.pecaId));
  res.status(204).send();
}

export async function removeImagem(req: Request, res: Response) {
  await service.deletePecaImagem(Number(req.params.arteiroId), Number(req.params.pecaId), Number(req.params.imagemId));
  res.status(204).send();
}

export async function getImagem(req: Request, res: Response) {
  const imagem = await service.getPecaImagem(Number(req.params.imagemId));
  if (!imagem) {
    throw new AppError('Imagem não encontrada', 404);
  }
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  res.contentType(imagem.mimeType);
  res.send(imagem.buffer);
}
