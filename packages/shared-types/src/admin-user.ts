import { z } from 'zod';

export const ADMIN_USER_STATUSES = ['ativo', 'desativado'] as const;
export type AdminUserStatus = (typeof ADMIN_USER_STATUSES)[number];

export interface AdminUser {
  id: string;
  email: string;
  nome: string;
  telefone: string | null;
  estado: AdminUserStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

const phoneSchema = z
  .string()
  .trim()
  .min(8, 'Telefone inválido')
  .max(20, 'Telefone inválido')
  .optional()
  .or(z.literal('').transform(() => undefined));

export const createAdminUserSchema = z.object({
  email: z.string().trim().toLowerCase().email('E-mail inválido'),
  nome: z.string().trim().min(2, 'Nome muito curto').max(120, 'Nome muito longo'),
  telefone: phoneSchema,
  estado: z.enum(ADMIN_USER_STATUSES).default('ativo'),
});

export const updateAdminUserSchema = z.object({
  email: z.string().trim().toLowerCase().email('E-mail inválido').optional(),
  nome: z.string().trim().min(2, 'Nome muito curto').max(120, 'Nome muito longo').optional(),
  telefone: phoneSchema.nullable(),
  estado: z.enum(ADMIN_USER_STATUSES).optional(),
});

export type CreateAdminUserInput = z.infer<typeof createAdminUserSchema>;
export type UpdateAdminUserInput = z.infer<typeof updateAdminUserSchema>;

export interface ListAdminUsersQuery {
  search?: string;
  estado?: AdminUserStatus;
  page?: number;
  pageSize?: number;
}

export interface ListAdminUsersResult {
  items: AdminUser[];
  total: number;
  page: number;
  pageSize: number;
}
