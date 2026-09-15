CREATE TABLE `usuario_tokens` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`usuario_id` text NOT NULL,
	`tipo` text NOT NULL,
	`token_hash` text NOT NULL,
	`expira_em` integer NOT NULL,
	`usado_em` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `usuario_tokens_token_hash_unique` ON `usuario_tokens` (`token_hash`);--> statement-breakpoint
CREATE INDEX `usuario_tokens_usuario_tipo_idx` ON `usuario_tokens` (`usuario_id`,`tipo`);--> statement-breakpoint
ALTER TABLE `configuracoes_site` ADD `logotipo` blob;--> statement-breakpoint
ALTER TABLE `configuracoes_site` ADD `logotipo_type` text;--> statement-breakpoint
ALTER TABLE `usuarios` ADD `senha_alterada_em` integer;