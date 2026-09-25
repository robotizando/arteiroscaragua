import { randomUUID } from 'crypto';
import { sqliteTable, text, integer, blob, real, primaryKey, index } from 'drizzle-orm/sqlite-core';
import {
  ACESSO_ATORES,
  ACESSO_METODOS,
  ADMIN_USER_STATUSES,
  ARTEIRO_STATUSES,
  CURSO_PARTICIPACAO_TIPOS,
  MATERIAL_STATUSES,
  USUARIO_STATUSES,
  USUARIO_TOKEN_TIPOS,
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

// Materiais de cada peça (n..n). Independe de arteiro_materiais, que lista os materiais do arteiro.
export const arteiroPecaMateriais = sqliteTable(
  'arteiro_peca_materiais',
  {
    pecaId: integer('peca_id')
      .notNull()
      .references(() => arteiroPecas.id),
    materialId: text('material_id')
      .notNull()
      .references(() => materiais.id),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.pecaId, table.materialId] }),
    materialIdx: index('arteiro_peca_materiais_material_idx').on(table.materialId),
  }),
);
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

// Usuários "normais" (arteiros e/ou moderadores), separados de admin_users.
export const usuarios = sqliteTable('usuarios', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  nome: text('nome').notNull(),
  email: text('email').notNull().unique(),
  // Hash bcrypt. Nulo quando o usuário só entra com Google (ou ainda não definiu senha).
  senhaHash: text('senha_hash'),
  googleId: text('google_id').unique(),
  // Flag independente do perfil de arteiro: um usuário com ou sem arteiro pode ser moderador.
  moderador: integer('moderador', { mode: 'boolean' }).notNull().default(false),
  // Perfil de artesão verificado (só faz sentido com vínculo em usuario_arteiros).
  arteiroVerificado: integer('arteiro_verificado', { mode: 'boolean' }).notNull().default(false),
  estado: text('estado', { enum: USUARIO_STATUSES }).notNull().default('ativo'),
  emailVerificadoEm: integer('email_verificado_em', { mode: 'timestamp' }),
  termosAceitosEm: integer('termos_aceitos_em', { mode: 'timestamp' }),
  // Respondeu ao modal de boas-vindas ("você é artesã(o)?"). Nulo = ainda não respondeu.
  boasVindasEm: integer('boas_vindas_em', { mode: 'timestamp' }),
  ultimoLoginEm: integer('ultimo_login_em', { mode: 'timestamp' }),
  // Tokens de sessão emitidos antes desta data deixam de valer (troca/redefinição de senha).
  senhaAlteradaEm: integer('senha_alterada_em', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  deletedAt: integer('deleted_at', { mode: 'timestamp' }),
});

export type UsuarioRow = typeof usuarios.$inferSelect;
export type NewUsuarioRow = typeof usuarios.$inferInsert;

// Tokens de uso único enviados por e-mail (verificação de conta e recuperação de senha).
export const usuarioTokens = sqliteTable(
  'usuario_tokens',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    usuarioId: text('usuario_id')
      .notNull()
      .references(() => usuarios.id),
    tipo: text('tipo', { enum: USUARIO_TOKEN_TIPOS }).notNull(),
    // SHA-256 do token; o token em claro só existe no link enviado.
    tokenHash: text('token_hash').notNull().unique(),
    expiraEm: integer('expira_em', { mode: 'timestamp' }).notNull(),
    usadoEm: integer('usado_em', { mode: 'timestamp' }),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    usuarioTipoIdx: index('usuario_tokens_usuario_tipo_idx').on(table.usuarioId, table.tipo),
  }),
);

export type UsuarioTokenRow = typeof usuarioTokens.$inferSelect;

// Vínculo n..n entre usuário e perfil de arteiro (hoje limitado a 1..1 na regra de negócio).
export const usuarioArteiros = sqliteTable(
  'usuario_arteiros',
  {
    usuarioId: text('usuario_id')
      .notNull()
      .references(() => usuarios.id),
    arteiroId: integer('arteiro_id')
      .notNull()
      .references(() => arteiros.id),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.usuarioId, table.arteiroId] }),
    arteiroIdx: index('usuario_arteiros_arteiro_idx').on(table.arteiroId),
  }),
);

export type UsuarioArteiroRow = typeof usuarioArteiros.$inferSelect;

// Peças que o usuário marcou como favoritas no site.
export const usuarioFavoritos = sqliteTable(
  'usuario_favoritos',
  {
    usuarioId: text('usuario_id')
      .notNull()
      .references(() => usuarios.id),
    pecaId: integer('peca_id')
      .notNull()
      .references(() => arteiroPecas.id),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.usuarioId, table.pecaId] }),
    pecaIdx: index('usuario_favoritos_peca_idx').on(table.pecaId),
  }),
);

export type UsuarioFavoritoRow = typeof usuarioFavoritos.$inferSelect;

// Log de acesso: registra todo login e toda tentativa (admin e usuários normais).
export const acessosLog = sqliteTable(
  'acessos_log',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    ator: text('ator', { enum: ACESSO_ATORES }).notNull(),
    metodo: text('metodo', { enum: ACESSO_METODOS }).notNull(),
    sucesso: integer('sucesso', { mode: 'boolean' }).notNull(),
    motivo: text('motivo'),
    // E-mail informado na tentativa (pode não corresponder a nenhum usuário).
    email: text('email'),
    adminUserId: text('admin_user_id').references(() => adminUsers.id),
    usuarioId: text('usuario_id').references(() => usuarios.id),
    ip: text('ip'),
    userAgent: text('user_agent'),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    createdAtIdx: index('acessos_log_created_at_idx').on(table.createdAt),
    emailIdx: index('acessos_log_email_idx').on(table.email),
    usuarioIdx: index('acessos_log_usuario_idx').on(table.usuarioId),
  }),
);

export type AcessoLogRow = typeof acessosLog.$inferSelect;
export type NewAcessoLogRow = typeof acessosLog.$inferInsert;

// Configurações gerais do site. Tabela de linha única (id sempre 1).
export const configuracoesSite = sqliteTable('configuracoes_site', {
  id: integer('id').primaryKey(),
  capa: blob('capa', { mode: 'buffer' }),
  capaType: text('capa_type'),
  logotipo: blob('logotipo', { mode: 'buffer' }),
  logotipoType: text('logotipo_type'),
  // HTML sanitizado vindo do editor WYSIWYG do admin.
  termosUso: text('termos_uso').notNull().default(''),
  politicaPrivacidade: text('politica_privacidade').notNull().default(''),
  quemSomos: text('quem_somos').notNull().default(''),
  // Barra de destaque exibida acima do cabeçalho do site (texto simples).
  destaqueTexto: text('destaque_texto').notNull().default(''),
  destaqueAtivo: integer('destaque_ativo', { mode: 'boolean' }).notNull().default(false),
  destaqueCor: text('destaque_cor').notNull().default('#B5DCA1'),
  destaqueAltura: integer('destaque_altura').notNull().default(36),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type ConfiguracaoSiteRow = typeof configuracoesSite.$inferSelect;
