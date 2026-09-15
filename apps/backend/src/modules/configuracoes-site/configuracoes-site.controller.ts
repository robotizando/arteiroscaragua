import { Request, Response } from 'express';
import {
  CONFIGURACAO_SITE_LOGOTIPO_MAX_BYTES,
  updateConfiguracaoSiteSchema,
} from '@arteiroscaragua/shared-types';
import { AppError } from '../../middlewares/error-handler';
import * as service from './configuracoes-site.service';

function extractImagem(req: Request, campo: service.ImagemCampo): service.ImagemFile | undefined {
  const file = (req.files as Record<string, Express.Multer.File[]> | undefined)?.[campo]?.[0];
  return file ? { buffer: file.buffer, mimeType: file.mimetype } : undefined;
}

export async function get(_req: Request, res: Response) {
  const configuracao = await service.getConfiguracaoSite();
  res.json({ configuracao });
}

export async function update(req: Request, res: Response) {
  const input = updateConfiguracaoSiteSchema.parse(req.body);
  const capa = extractImagem(req, 'capa');
  const logotipo = extractImagem(req, 'logotipo');
  // O limite do multer é o da capa (o maior); o logotipo tem limite próprio.
  if (logotipo && logotipo.buffer.length > CONFIGURACAO_SITE_LOGOTIPO_MAX_BYTES) {
    throw new AppError('Logotipo excede o tamanho máximo permitido', 400);
  }
  const configuracao = await service.updateConfiguracaoSite(input, { capa, logotipo });
  res.json({ configuracao });
}

function imagemHandler(campo: service.ImagemCampo, notFoundMessage: string) {
  return async (_req: Request, res: Response) => {
    const imagem = await service.getImagem(campo);
    if (!imagem) {
      throw new AppError(notFoundMessage, 404);
    }
    // A URL leva ?v=<updatedAt>, então pode ser cacheada indefinidamente.
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.contentType(imagem.mimeType);
    res.send(imagem.buffer);
  };
}

export const getCapa = imagemHandler('capa', 'Capa não encontrada');
export const getLogotipo = imagemHandler('logotipo', 'Logotipo não encontrado');
