import path from 'path';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { db } from './client';

migrate(db, { migrationsFolder: path.resolve(__dirname, '../../drizzle') });

console.log('✓ Migrations aplicadas com sucesso');
