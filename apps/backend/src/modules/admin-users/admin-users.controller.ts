import { Request, Response } from 'express';
import {
  createAdminUserSchema,
  updateAdminUserSchema,
  type AdminUserStatus,
} from '@arteiroscaragua/shared-types';
import * as service from './admin-users.service';

export async function list(req: Request, res: Response) {
  const { search, estado, page, pageSize } = req.query;

  const result = await service.listAdminUsers({
    search: typeof search === 'string' ? search : undefined,
    estado: typeof estado === 'string' ? (estado as AdminUserStatus) : undefined,
    page: page ? Number(page) : undefined,
    pageSize: pageSize ? Number(pageSize) : undefined,
  });

  res.json(result);
}

export async function getById(req: Request, res: Response) {
  const admin = await service.getAdminUserById(req.params.id);
  res.json({ admin });
}

export async function create(req: Request, res: Response) {
  const input = createAdminUserSchema.parse(req.body);
  const admin = await service.createAdminUser(input);
  res.status(201).json({ admin });
}

export async function update(req: Request, res: Response) {
  const input = updateAdminUserSchema.parse(req.body);
  const admin = await service.updateAdminUser(req.params.id, input);
  res.json({ admin });
}

export async function remove(req: Request, res: Response) {
  await service.deleteAdminUser(req.params.id);
  res.status(204).send();
}
