CREATE TABLE `configuracoes_site` (
	`id` integer PRIMARY KEY NOT NULL,
	`capa` blob,
	`capa_type` text,
	`termos_uso` text DEFAULT '' NOT NULL,
	`politica_privacidade` text DEFAULT '' NOT NULL,
	`quem_somos` text DEFAULT '' NOT NULL,
	`updated_at` integer NOT NULL
);
