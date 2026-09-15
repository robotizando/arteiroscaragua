import { and, asc, desc, eq, exists, inArray, isNull, like, ne, or, sql } from 'drizzle-orm';
import type {
  CreateUsuarioInput,
  ListUsuariosQuery,
  ListUsuariosResult,
  SetUsuarioArteirosInput,
  UpdateUsuarioInput,
  Usuario,
  UsuarioArteiroRef,
} from '@arteiroscaragua/shared-types';
import { db, arteiros, usuarioArteiros, usuarios, type UsuarioRow } from '../../database/client';
import { AppError } from '../../middlewares/error-handler';
import { toUsuarioDTO } from './usuarios.mapper';
import { hashSenha } from './senha';

const MAX_PAGE_SIZE = 100;

async function findActiveById(id: string) {
  const [row] = await db
    .select()
    .from(usuarios)
    .where(and(eq(usuarios.id, id), isNull(usuarios.deletedAt)));
  return row;
}

export async function loadArteiroRefs(usuarioIds: string[]): Promise<Map<string, UsuarioArteiroRef[]>> {
  const refs = new Map<string, UsuarioArteiroRef[]>();
  if (!usuarioIds.length) return refs;

  const rows = await db
    .select({ usuarioId: usuarioArteiros.usuarioId, id: arteiros.id, nome: arteiros.nome })
    .from(usuarioArteiros)
    .innerJoin(arteiros, eq(arteiros.id, usuarioArteiros.arteiroId))
    .where(and(inArray(usuarioArteiros.usuarioId, usuarioIds), isNull(arteiros.deletedAt)))
    .orderBy(asc(arteiros.nome));

  for (const row of rows) {
    const list = refs.get(row.usuarioId) ?? [];
    list.push({ id: row.id, nome: row.nome });
    refs.set(row.usuarioId, list);
  }
  return refs;
}

async function toDTOWithArteiros(row: UsuarioRow): Promise<Usuario> {
  const refs = await loadArteiroRefs([row.id]);
  return toUsuarioDTO(row, refs.get(row.id) ?? []);
}

async function assertEmailAvailable(email: string, ignoreId?: string) {
  const [existing] = await db.select().from(usuarios).where(eq(usuarios.email, email));
  if (existing && existing.id !== ignoreId) {
    throw new AppError('Já existe um usuário com este e-mail', 409);
  }
}

// Garante que os perfis existem e não pertencem a outro usuário (não excluído).
async function assertArteirosDisponiveis(arteiroIds: number[], usuarioId?: string) {
  if (!arteiroIds.length) return;

  const existentes = await db
    .select({ id: arteiros.id })
    .from(arteiros)
    .where(and(inArray(arteiros.id, arteiroIds), isNull(arteiros.deletedAt)));
  if (existentes.length !== arteiroIds.length) {
    throw new AppError('Um ou mais perfis de arteiro informados não existem', 400);
  }

  const conditions = [inArray(usuarioArteiros.arteiroId, arteiroIds), isNull(usuarios.deletedAt)];
  if (usuarioId) conditions.push(ne(usuarioArteiros.usuarioId, usuarioId));

  const [vinculado] = await db
    .select({ arteiroId: usuarioArteiros.arteiroId, email: usuarios.email })
    .from(usuarioArteiros)
    .innerJoin(usuarios, eq(usuarios.id, usuarioArteiros.usuarioId))
    .where(and(...conditions))
    .limit(1);
  if (vinculado) {
    throw new AppError(`O perfil de arteiro #${vinculado.arteiroId} já está vinculado ao usuário ${vinculado.email}`, 409);
  }
}

export async function listUsuarios(query: ListUsuariosQuery): Promise<ListUsuariosResult> {
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, query.pageSize ?? 20));

  const conditions = [isNull(usuarios.deletedAt)];
  if (query.papel === 'moderador') {
    conditions.push(eq(usuarios.moderador, true));
  } else if (query.papel === 'arteiro') {
    conditions.push(
      exists(db.select().from(usuarioArteiros).where(eq(usuarioArteiros.usuarioId, usuarios.id))),
    );
  } else if (query.papel === 'arteiro_verificado') {
    conditions.push(eq(usuarios.arteiroVerificado, true));
  }
  if (query.estado) {
    conditions.push(eq(usuarios.estado, query.estado));
  }
  if (query.search) {
    const term = `%${query.search.trim()}%`;
    conditions.push(or(like(usuarios.nome, term), like(usuarios.email, term))!);
  }

  const where = and(...conditions);

  const [rows, [{ count }]] = await Promise.all([
    db
      .select()
      .from(usuarios)
      .where(where)
      .orderBy(desc(usuarios.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ count: sql<number>`count(*)` }).from(usuarios).where(where),
  ]);

  const refs = await loadArteiroRefs(rows.map((row) => row.id));

  return {
    items: rows.map((row) => toUsuarioDTO(row, refs.get(row.id) ?? [])),
    total: count,
    page,
    pageSize,
  };
}

export async function getUsuarioById(id: string): Promise<Usuario> {
  const row = await findActiveById(id);
  if (!row) {
    throw new AppError('Usuário não encontrado', 404);
  }
  return toDTOWithArteiros(row);
}

// Cria o usuário e vincula um perfil de arteiro existente, ou cria um novo perfil com o
// mesmo nome (mesmo comportamento do futuro auto-cadastro), ou deixa sem perfil.
export async function createUsuario(input: CreateUsuarioInput): Promise<Usuario> {
  const temPerfilArteiro = input.arteiroId !== undefined || input.criarPerfilArteiro;
  if (input.arteiroVerificado && !temPerfilArteiro) {
    throw new AppError('Somente usuários com perfil de arteiro podem ter o perfil verificado', 400);
  }

  await assertEmailAvailable(input.email);
  if (input.arteiroId !== undefined) {
    await assertArteirosDisponiveis([input.arteiroId]);
  }

  const senhaHash = input.senha ? await hashSenha(input.senha) : null;

  const row = db.transaction((tx) => {
    const usuario = tx
      .insert(usuarios)
      .values({
        nome: input.nome,
        email: input.email,
        senhaHash,
        moderador: input.moderador,
        arteiroVerificado: input.arteiroVerificado,
        estado: input.estado ?? 'ativo',
        emailVerificadoEm: input.emailVerificado ? new Date() : null,
      })
      .returning()
      .get();

    if (temPerfilArteiro) {
      const arteiroId =
        input.arteiroId ??
        tx.insert(arteiros).values({ nome: input.nome }).returning({ id: arteiros.id }).get().id;
      tx.insert(usuarioArteiros).values({ usuarioId: usuario.id, arteiroId }).run();
    }

    return usuario;
  });

  return toDTOWithArteiros(row);
}

export async function updateUsuario(id: string, input: UpdateUsuarioInput): Promise<Usuario> {
  const current = await findActiveById(id);
  if (!current) {
    throw new AppError('Usuário não encontrado', 404);
  }

  const emailMudou = input.email !== undefined && input.email !== current.email;
  if (emailMudou) {
    await assertEmailAvailable(input.email!, id);
  }

  if (input.arteiroVerificado === true && !current.arteiroVerificado) {
    const refs = await loadArteiroRefs([id]);
    if (!refs.get(id)?.length) {
      throw new AppError('Somente usuários com perfil de arteiro podem ter o perfil verificado', 400);
    }
  }

  // Troca de e-mail invalida a verificação anterior, a menos que o admin marque como verificado.
  let emailVerificadoEm: Date | null | undefined;
  if (input.emailVerificado === true) {
    emailVerificadoEm = current.emailVerificadoEm && !emailMudou ? current.emailVerificadoEm : new Date();
  } else if (input.emailVerificado === false || emailMudou) {
    emailVerificadoEm = null;
  }

  const senhaHash = input.senha ? await hashSenha(input.senha) : undefined;

  const [row] = await db
    .update(usuarios)
    .set({
      ...(input.nome !== undefined ? { nome: input.nome } : {}),
      ...(input.email !== undefined ? { email: input.email } : {}),
      ...(input.moderador !== undefined ? { moderador: input.moderador } : {}),
      ...(input.arteiroVerificado !== undefined ? { arteiroVerificado: input.arteiroVerificado } : {}),
      ...(input.estado !== undefined ? { estado: input.estado } : {}),
      ...(senhaHash !== undefined ? { senhaHash } : {}),
      ...(emailVerificadoEm !== undefined ? { emailVerificadoEm } : {}),
      updatedAt: new Date(),
    })
    .where(eq(usuarios.id, id))
    .returning();

  return toDTOWithArteiros(row);
}

export async function setUsuarioArteiros(id: string, input: SetUsuarioArteirosInput): Promise<Usuario> {
  const current = await findActiveById(id);
  if (!current) {
    throw new AppError('Usuário não encontrado', 404);
  }

  const uniqueIds = Array.from(new Set(input.arteiroIds));

  await assertArteirosDisponiveis(uniqueIds, id);

  const vinculoAtual = (await loadArteiroRefs([id])).get(id)?.map((ref) => ref.id) ?? [];
  const vinculoMudou =
    vinculoAtual.length !== uniqueIds.length || vinculoAtual.some((arteiroId) => !uniqueIds.includes(arteiroId));

  const row = db.transaction((tx) => {
    tx.delete(usuarioArteiros).where(eq(usuarioArteiros.usuarioId, id)).run();
    if (uniqueIds.length) {
      tx.insert(usuarioArteiros)
        .values(uniqueIds.map((arteiroId) => ({ usuarioId: id, arteiroId })))
        .run();
    }

    // A verificação vale para o perfil vinculado: trocar ou remover o perfil a desfaz.
    if (vinculoMudou && current.arteiroVerificado) {
      return tx
        .update(usuarios)
        .set({ arteiroVerificado: false, updatedAt: new Date() })
        .where(eq(usuarios.id, id))
        .returning()
        .get();
    }
    return current;
  });

  return toDTOWithArteiros(row);
}

// Exclusão lógica. O perfil de arteiro e o vínculo são mantidos como histórico;
// um usuário excluído não impede que o perfil seja vinculado a outro usuário.
export async function deleteUsuario(id: string): Promise<void> {
  const current = await findActiveById(id);
  if (!current) {
    throw new AppError('Usuário não encontrado', 404);
  }

  await db
    .update(usuarios)
    .set({ deletedAt: new Date(), estado: 'bloqueado', updatedAt: new Date() })
    .where(eq(usuarios.id, id));
}
