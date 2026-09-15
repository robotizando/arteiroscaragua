import { Request, Response } from 'express';
import { ACESSO_ATORES, type AcessoAtor } from '@arteiroscaragua/shared-types';
import * as service from './acessos.service';

export async function list(req: Request, res: Response) {
  const { ator, usuarioId, adminUserId, email, sucesso, page, pageSize } = req.query;

  const result = await service.listAcessos({
    ator:
      typeof ator === 'string' && (ACESSO_ATORES as readonly string[]).includes(ator)
        ? (ator as AcessoAtor)
        : undefined,
    usuarioId: typeof usuarioId === 'string' ? usuarioId : undefined,
    adminUserId: typeof adminUserId === 'string' ? adminUserId : undefined,
    email: typeof email === 'string' ? email : undefined,
    sucesso: sucesso === 'true' ? true : sucesso === 'false' ? false : undefined,
    page: page ? Number(page) : undefined,
    pageSize: pageSize ? Number(pageSize) : undefined,
  });

  res.json(result);
}
