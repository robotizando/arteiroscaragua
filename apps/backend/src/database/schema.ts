import { randomUUID } from 'crypto';
import { sqliteTable, text, integer, blob, real, primaryKey } from 'drizzle-orm/sqlite-core';
import {
  ADMIN_USER_STATUSES,
  ARTEIRO_STATUSES,
  CURSO_PARTICIPACAO_TIPOS,
  MATERIAL_STATUSES,
} from '@arteiroscaragua/shared-types';

export const adminUsers = sqliteTable('admin_users', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  email: text('email').notNull().unique(),
  nome: text('nome').notNull(),
  telefone: text('telefone'),
  estado: text('estado', { enum: ADMIN_USER_STATUSES }).notNull().default('ativo'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  deletedAt: integer('deleted_at', { mode: 'timestamp' }),
});

export type AdminUserRow = typeof adminUsers.$inferSelect;
export type NewAdminUserRow = typeof adminUsers.$inferInsert;

export const materiais = sqliteTable('materiais', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  nome: text('nome').notNull(),
  slug: text('slug').notNull().unique(),
  descricao: text('descricao').notNull(),
  imagemUrl: text('imagem_url'),
  thumbnail: blob('thumbnail', { mode: 'buffer' }),
  thumbnailType: text('thumbnail_type'),
  ordem: integer('ordem').notNull().default(0),
  estado: text('estado', { enum: MATERIAL_STATUSES }).notNull().default('ativo'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  deletedAt: integer('deleted_at', { mode: 'timestamp' }),
});

export type MaterialRow = typeof materiais.$inferSelect;
export type NewMaterialRow = typeof materiais.$inferInsert;

export const arteiros = sqliteTable('arteiros', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  nome: text('nome').notNull(),
  telefone: text('telefone'),
  sicab: text('sicab'),
  grupo: text('grupo'),
  arroba: text('arroba'),
  redesSociais: text('redes_sociais'),
  biografia: text('biografia'),
  logotipo: blob('logotipo', { mode: 'buffer' }),
  logotipoType: text('logotipo_type'),
  estado: text('estado', { enum: ARTEIRO_STATUSES }).notNull().default('ativo'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  deletedAt: integer('deleted_at', { mode: 'timestamp' }),
});

export type ArteiroRow = typeof arteiros.$inferSelect;
export type NewArteiroRow = typeof arteiros.$inferInsert;

export const arteiroMateriais = sqliteTable(
  'arteiro_materiais',
  {
    arteiroId: integer('arteiro_id')
      .notNull()
      .references(() => arteiros.id),
    materialId: text('material_id')
      .notNull()
      .references(() => materiais.id),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.arteiroId, table.materialId] }),
  }),
);

export const arteiroPecas = sqliteTable('arteiro_pecas', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  arteiroId: integer('arteiro_id')
    .notNull()
    .references(() => arteiros.id),
  nome: text('nome').notNull(),
  valorSugerido: real('valor_sugerido'),
  descricao: text('descricao').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type ArteiroPecaRow = typeof arteiroPecas.$inferSelect;
export type NewArteiroPecaRow = typeof arteiroPecas.$inferInsert;

export const arteiroPecaImagens = sqliteTable('arteiro_peca_imagens', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  pecaId: integer('peca_id')
    .notNull()
    .references(() => arteiroPecas.id),
  imagem: blob('imagem', { mode: 'buffer' }).notNull(),
  imagemType: text('imagem_type').notNull(),
  ordem: integer('ordem').notNull().default(0),
});

export type ArteiroPecaImagemRow = typeof arteiroPecaImagens.$inferSelect;
export type NewArteiroPecaImagemRow = typeof arteiroPecaImagens.$inferInsert;

export const arteiroPremios = sqliteTable('arteiro_premios', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  arteiroId: integer('arteiro_id')
    .notNull()
    .references(() => arteiros.id),
  nome: text('nome').notNull(),
  ano: integer('ano').notNull(),
  categoria: text('categoria'),
  instituicao: text('instituicao'),
  descricao: text('descricao'),
});

export type ArteiroPremioRow = typeof arteiroPremios.$inferSelect;
export type NewArteiroPremioRow = typeof arteiroPremios.$inferInsert;

export const arteiroVideos = sqliteTable('arteiro_videos', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  arteiroId: integer('arteiro_id')
    .notNull()
    .references(() => arteiros.id),
  url: text('url').notNull(),
});

export type ArteiroVideoRow = typeof arteiroVideos.$inferSelect;
export type NewArteiroVideoRow = typeof arteiroVideos.$inferInsert;

export const arteiroEventos = sqliteTable('arteiro_eventos', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  arteiroId: integer('arteiro_id')
    .notNull()
    .references(() => arteiros.id),
  nome: text('nome').notNull(),
  mesAno: text('mes_ano').notNull(),
  descricaoParticipacao: text('descricao_participacao'),
});

export type ArteiroEventoRow = typeof arteiroEventos.$inferSelect;
export type NewArteiroEventoRow = typeof arteiroEventos.$inferInsert;

export const arteiroCursos = sqliteTable('arteiro_cursos', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  arteiroId: integer('arteiro_id')
    .notNull()
    .references(() => arteiros.id),
  nome: text('nome').notNull(),
  cargaHoraria: integer('carga_horaria'),
  descricao: text('descricao'),
  tipoParticipacao: text('tipo_participacao', { enum: CURSO_PARTICIPACAO_TIPOS }).notNull().default('aluno'),
});

export type ArteiroCursoRow = typeof arteiroCursos.$inferSelect;
export type NewArteiroCursoRow = typeof arteiroCursos.$inferInsert;

export const arteiroProjetos = sqliteTable('arteiro_projetos', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  arteiroId: integer('arteiro_id')
    .notNull()
    .references(() => arteiros.id),
  descricao: text('descricao').notNull(),
});

export type ArteiroProjetoRow = typeof arteiroProjetos.$inferSelect;
export type NewArteiroProjetoRow = typeof arteiroProjetos.$inferInsert;
