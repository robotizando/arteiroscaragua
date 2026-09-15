import type { Material } from '@arteiroscaragua/shared-types';
import type { MaterialRow } from '../../database/client';

export function materialThumbnailUrl(id: string, updatedAt: Date): string {
  return `/api/materiais/${id}/thumbnail?v=${updatedAt.getTime()}`;
}

export function toMaterialDTO(row: MaterialRow): Material {
  return {
    id: row.id,
    nome: row.nome,
    slug: row.slug,
    descricao: row.descricao,
    imagemUrl: row.imagemUrl,
    thumbnailUrl: row.thumbnail ? materialThumbnailUrl(row.id, row.updatedAt) : null,
    ordem: row.ordem,
    estado: row.estado,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    deletedAt: row.deletedAt ? row.deletedAt.toISOString() : null,
  };
}
