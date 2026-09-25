import { Router } from 'express';
import { and, asc, eq } from 'drizzle-orm';
import type { AnySQLiteColumn, SQLiteTable } from 'drizzle-orm/sqlite-core';
import type { ZodTypeAny } from 'zod';
import { db } from '../../database/client';
import { AppError, asyncHandler } from '../../middlewares/error-handler';

interface ChildRow {
  id: number;
  arteiroId: number;
}

interface ChildCollectionConfig<Row extends ChildRow, DTO> {
  table: SQLiteTable & { id: AnySQLiteColumn; arteiroId: AnySQLiteColumn };
  createSchema: ZodTypeAny;
  updateSchema: ZodTypeAny;
  toDTO: (row: Row) => DTO;
  notFoundMessage: string;
}

// Fábrica de rotas CRUD para as coleções filhas simples de um arteiro
// (prêmios, vídeos, eventos, cursos, projetos), evitando repetir a mesma
// estrutura de controller/service/router cinco vezes.
export function createChildCollectionRouter<Row extends ChildRow, DTO>(config: ChildCollectionConfig<Row, DTO>) {
  const { table, createSchema, updateSchema, toDTO, notFoundMessage } = config;

  async function findOwned(arteiroId: number, id: number) {
    const [row] = await db
      .select()
      .from(table)
      .where(and(eq(table.id, id), eq(table.arteiroId, arteiroId)));
    return row as Row | undefined;
  }

  // A autenticação vem do router pai (Admin ou perfil do próprio arteiro no site).
  const router = Router({ mergeParams: true });

  router.get(
    '/',
    asyncHandler(async (req, res) => {
      const arteiroId = Number(req.params.arteiroId);
      const rows = await db.select().from(table).where(eq(table.arteiroId, arteiroId)).orderBy(asc(table.id));
      res.json({ items: (rows as Row[]).map(toDTO) });
    }),
  );

  router.post(
    '/',
    asyncHandler(async (req, res) => {
      const arteiroId = Number(req.params.arteiroId);
      const input = createSchema.parse(req.body);
      const [row] = await db
        .insert(table)
        .values({ ...input, arteiroId } as never)
        .returning();
      res.status(201).json({ item: toDTO(row as Row) });
    }),
  );

  router.patch(
    '/:childId',
    asyncHandler(async (req, res) => {
      const arteiroId = Number(req.params.arteiroId);
      const childId = Number(req.params.childId);
      const existing = await findOwned(arteiroId, childId);
      if (!existing) {
        throw new AppError(notFoundMessage, 404);
      }
      const input = updateSchema.parse(req.body);
      const [row] = await db
        .update(table)
        .set(input as never)
        .where(eq(table.id, childId))
        .returning();
      res.json({ item: toDTO(row as Row) });
    }),
  );

  router.delete(
    '/:childId',
    asyncHandler(async (req, res) => {
      const arteiroId = Number(req.params.arteiroId);
      const childId = Number(req.params.childId);
      const existing = await findOwned(arteiroId, childId);
      if (!existing) {
        throw new AppError(notFoundMessage, 404);
      }
      await db.delete(table).where(eq(table.id, childId));
      res.status(204).send();
    }),
  );

  return router;
}
