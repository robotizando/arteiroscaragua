import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import multer from 'multer';

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    // Código estável para o frontend decidir o que mostrar (ex.: email_nao_verificado).
    public codigo?: string,
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Dados inválidos',
      issues: err.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message, ...(err.codigo ? { codigo: err.codigo } : {}) });
  }

  if (err instanceof multer.MulterError) {
    const message =
      err.code === 'LIMIT_FILE_SIZE' ? 'Imagem excede o tamanho máximo permitido' : 'Falha no upload do arquivo';
    return res.status(400).json({ error: message });
  }

  if (err.message === 'Formato de imagem não suportado') {
    return res.status(400).json({ error: err.message });
  }

  console.error('[ERROR]', err);
  return res.status(500).json({ error: 'Erro interno do servidor' });
}
