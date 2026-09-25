import type { RequestHandler } from 'express';
import multer from 'multer';
import {
  ARTEIRO_LOGOTIPO_MAX_BYTES,
  ARTEIRO_LOGOTIPO_MIME_TYPES,
  ARTEIRO_PECA_IMAGEM_MAX_BYTES,
  ARTEIRO_PECA_IMAGEM_MIME_TYPES,
  ARTEIRO_PECA_MAX_IMAGENS,
} from '@arteiroscaragua/shared-types';

// Uploads de imagens do arteiro, compartilhados pelas rotas da Admin e pelas do perfil do site.
function imagemUpload(mimeTypes: readonly string[], maxBytes: number, maxFiles?: number) {
  return multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxBytes, ...(maxFiles ? { files: maxFiles } : {}) },
    fileFilter: (_req, file, cb) => {
      if (!mimeTypes.includes(file.mimetype)) {
        cb(new Error('Formato de imagem não suportado'));
        return;
      }
      cb(null, true);
    },
  });
}

export const uploadLogotipo: RequestHandler = imagemUpload(ARTEIRO_LOGOTIPO_MIME_TYPES, ARTEIRO_LOGOTIPO_MAX_BYTES).single('logotipo');

export const uploadPecaImagens: RequestHandler = imagemUpload(
  ARTEIRO_PECA_IMAGEM_MIME_TYPES,
  ARTEIRO_PECA_IMAGEM_MAX_BYTES,
  ARTEIRO_PECA_MAX_IMAGENS,
).array('imagens', ARTEIRO_PECA_MAX_IMAGENS);
