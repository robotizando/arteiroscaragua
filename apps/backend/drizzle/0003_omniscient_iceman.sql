CREATE TABLE `arteiro_cursos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`arteiro_id` integer NOT NULL,
	`nome` text NOT NULL,
	`carga_horaria` integer,
	`descricao` text,
	`tipo_participacao` text DEFAULT 'aluno' NOT NULL,
	FOREIGN KEY (`arteiro_id`) REFERENCES `arteiros`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `arteiro_eventos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`arteiro_id` integer NOT NULL,
	`nome` text NOT NULL,
	`mes_ano` text NOT NULL,
	`descricao_participacao` text,
	FOREIGN KEY (`arteiro_id`) REFERENCES `arteiros`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `arteiro_materiais` (
	`arteiro_id` integer NOT NULL,
	`material_id` text NOT NULL,
	PRIMARY KEY(`arteiro_id`, `material_id`),
	FOREIGN KEY (`arteiro_id`) REFERENCES `arteiros`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`material_id`) REFERENCES `materiais`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `arteiro_peca_imagens` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`peca_id` integer NOT NULL,
	`imagem` blob NOT NULL,
	`imagem_type` text NOT NULL,
	`ordem` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`peca_id`) REFERENCES `arteiro_pecas`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `arteiro_pecas` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`arteiro_id` integer NOT NULL,
	`nome` text NOT NULL,
	`valor_sugerido` real,
	`descricao` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`arteiro_id`) REFERENCES `arteiros`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `arteiro_premios` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`arteiro_id` integer NOT NULL,
	`nome` text NOT NULL,
	`ano` integer NOT NULL,
	`categoria` text,
	`instituicao` text,
	`descricao` text,
	FOREIGN KEY (`arteiro_id`) REFERENCES `arteiros`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `arteiro_projetos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`arteiro_id` integer NOT NULL,
	`descricao` text NOT NULL,
	FOREIGN KEY (`arteiro_id`) REFERENCES `arteiros`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `arteiro_videos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`arteiro_id` integer NOT NULL,
	`url` text NOT NULL,
	FOREIGN KEY (`arteiro_id`) REFERENCES `arteiros`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `arteiros` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nome` text NOT NULL,
	`telefone` text,
	`sicab` text,
	`grupo` text,
	`arroba` text,
	`redes_sociais` text,
	`biografia` text,
	`logotipo` blob,
	`logotipo_type` text,
	`estado` text DEFAULT 'ativo' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer
);
