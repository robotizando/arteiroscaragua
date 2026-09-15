import type { AdminUser } from '@arteiroscaragua/shared-types';
import type { AdminUserRow } from '../../database/client';

export function toAdminUserDTO(row: AdminUserRow): AdminUser {
  return {
    id: row.id,
    email: row.email,
    nome: row.nome,
    telefone: row.telefone,
    estado: row.estado,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    deletedAt: row.deletedAt ? row.deletedAt.toISOString() : null,
  };
}
