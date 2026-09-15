ALTER TABLE `configuracoes_site` ADD `destaque_texto` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `configuracoes_site` ADD `destaque_ativo` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `configuracoes_site` ADD `destaque_cor` text DEFAULT '#B5DCA1' NOT NULL;--> statement-breakpoint
ALTER TABLE `configuracoes_site` ADD `destaque_altura` integer DEFAULT 36 NOT NULL;