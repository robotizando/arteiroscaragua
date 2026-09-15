import path from 'path';
import fs from 'fs';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { config } from '../config';
import * as schema from './schema';

const dbPath = path.resolve(process.cwd(), config.database.url);
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const sqlite = new Database(dbPath);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

// Minúsculas e sem acentos, para buscas como "ceramica" encontrarem "Cerâmica"
// (o LIKE do SQLite só ignora maiúsculas/minúsculas em ASCII).
export function normalizarBusca(value: string): string {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}
sqlite.function('normalizar', { deterministic: true }, (value: unknown) =>
  typeof value === 'string' ? normalizarBusca(value) : value,
);

export const db = drizzle(sqlite, { schema });

export * from './schema';
