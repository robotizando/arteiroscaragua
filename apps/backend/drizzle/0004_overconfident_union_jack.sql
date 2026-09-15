CREATE TABLE `acessos_log` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`ator` text NOT NULL,
	`metodo` text NOT NULL,
	`sucesso` integer NOT NULL,
	`motivo` text,
	`email` text,
	`admin_user_id` text,
	`usuario_id` text,
	`ip` text,
	`user_agent` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`admin_user_id`) REFERENCES `admin_users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `acessos_log_created_at_idx` ON `acessos_log` (`created_at`);--> statement-breakpoint
CREATE INDEX `acessos_log_email_idx` ON `acessos_log` (`email`);--> statement-breakpoint
CREATE INDEX `acessos_log_usuario_idx` ON `acessos_log` (`usuario_id`);--> statement-breakpoint
CREATE TABLE `usuario_arteiros` (
	`usuario_id` text NOT NULL,
	`arteiro_id` integer NOT NULL,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`usuario_id`, `arteiro_id`),
	FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`arteiro_id`) REFERENCES `arteiros`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `usuario_arteiros_arteiro_idx` ON `usuario_arteiros` (`arteiro_id`);--> statement-breakpoint
CREATE TABLE `usuarios` (
	`id` text PRIMARY KEY NOT NULL,
	`nome` text NOT NULL,
	`email` text NOT NULL,
	`senha_hash` text,
	`google_id` text,
	`tipo` text NOT NULL,
	`estado` text DEFAULT 'ativo' NOT NULL,
	`email_verificado_em` integer,
	`termos_aceitos_em` integer,
	`ultimo_login_em` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `usuarios_email_unique` ON `usuarios` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `usuarios_google_id_unique` ON `usuarios` (`google_id`);