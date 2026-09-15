import { eq } from 'drizzle-orm';
import { db, adminUsers } from './client';
import { config } from '../config';

async function seed() {
  const [existing] = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.email, config.defaultAdmin.email));

  if (existing) {
    console.log(`✓ Admin padrão já existe: ${config.defaultAdmin.email}`);
    return;
  }

  await db.insert(adminUsers).values({
    email: config.defaultAdmin.email,
    nome: config.defaultAdmin.nome,
    estado: 'ativo',
  });

  console.log(`✓ Admin padrão criado: ${config.defaultAdmin.email}`);
}

seed()
  .catch((error) => {
    console.error('Erro ao rodar o seed:', error);
    process.exitCode = 1;
  });
