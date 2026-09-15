import type { Usuario, UsuarioArteiroRef } from '@arteiroscaragua/shared-types';
import type { UsuarioRow } from '../../database/client';

export function toUsuarioDTO(row: UsuarioRow, arteiros: UsuarioArteiroRef[]): Usuario {
  return {
    id: row.id,
    nome: row.nome,
    email: row.email,
    moderador: row.moderador,
    arteiroVerificado: row.arteiroVerificado,
    estado: row.estado,
    possuiSenha: Boolean(row.senhaHash),
    googleVinculado: Boolean(row.googleId),
    emailVerificadoEm: row.emailVerificadoEm ? row.emailVerificadoEm.toISOString() : null,
    termosAceitosEm: row.termosAceitosEm ? row.termosAceitosEm.toISOString() : null,
    ultimoLoginEm: row.ultimoLoginEm ? row.ultimoLoginEm.toISOString() : null,
    arteiros,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    deletedAt: row.deletedAt ? row.deletedAt.toISOString() : null,
  };
}
