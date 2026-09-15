import type { AcessoLog } from '@arteiroscaragua/shared-types';
import type { AcessoLogRow } from '../../database/client';

export function toAcessoLogDTO(row: AcessoLogRow): AcessoLog {
  return {
    id: row.id,
    ator: row.ator,
    metodo: row.metodo,
    sucesso: row.sucesso,
    motivo: row.motivo,
    email: row.email,
    adminUserId: row.adminUserId,
    usuarioId: row.usuarioId,
    ip: row.ip,
    userAgent: row.userAgent,
    createdAt: row.createdAt.toISOString(),
  };
}
