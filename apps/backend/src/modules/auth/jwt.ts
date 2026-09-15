import jwt from 'jsonwebtoken';
import type { JwtAdminPayload } from '@arteiroscaragua/shared-types';
import { config } from '../../config';

export function signAdminToken(payload: JwtAdminPayload): string {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  } as jwt.SignOptions);
}

export function verifyAdminToken(token: string): JwtAdminPayload {
  return jwt.verify(token, config.jwt.secret) as JwtAdminPayload;
}
