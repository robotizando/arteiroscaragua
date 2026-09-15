import type { AdminUser } from './admin-user';

export const LOGIN_ERROR_CODES = ['not_authorized', 'auth_failed', 'no_email'] as const;
export type LoginErrorCode = (typeof LOGIN_ERROR_CODES)[number];

export interface MeResponse {
  admin: AdminUser;
}

export interface JwtAdminPayload {
  sub: string;
  email: string;
}
