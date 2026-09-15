import bcrypt from 'bcryptjs';
import { config } from '../../config';

export function hashSenha(senha: string): Promise<string> {
  return bcrypt.hash(senha, config.bcryptCost);
}

export function compararSenha(senha: string, senhaHash: string): Promise<boolean> {
  return bcrypt.compare(senha, senhaHash);
}
