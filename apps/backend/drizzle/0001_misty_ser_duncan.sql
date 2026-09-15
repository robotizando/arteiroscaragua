CREATE TABLE `materiais` (
	`id` text PRIMARY KEY NOT NULL,
	`nome` text NOT NULL,
	`slug` text NOT NULL,
	`descricao` text NOT NULL,
	`imagem_url` text,
	`ordem` integer DEFAULT 0 NOT NULL,
	`estado` text DEFAULT 'ativo' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `materiais_slug_unique` ON `materiais` (`slug`);