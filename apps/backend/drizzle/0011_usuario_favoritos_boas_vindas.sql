CREATE TABLE `usuario_favoritos` (
	`usuario_id` text NOT NULL,
	`peca_id` integer NOT NULL,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`usuario_id`, `peca_id`),
	FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`peca_id`) REFERENCES `arteiro_pecas`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `usuario_favoritos_peca_idx` ON `usuario_favoritos` (`peca_id`);--> statement-breakpoint
ALTER TABLE `usuarios` ADD `boas_vindas_em` integer;--> statement-breakpoint
-- Quem já tem conta passou pelo fluxo antigo (ou foi criado pela Admin): não faz sentido
-- abrir o modal de boas-vindas para essas pessoas no próximo acesso.
UPDATE `usuarios` SET `boas_vindas_em` = `created_at`;
