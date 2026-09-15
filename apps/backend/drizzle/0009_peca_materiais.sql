CREATE TABLE `arteiro_peca_materiais` (
	`peca_id` integer NOT NULL,
	`material_id` text NOT NULL,
	PRIMARY KEY(`peca_id`, `material_id`),
	FOREIGN KEY (`peca_id`) REFERENCES `arteiro_pecas`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`material_id`) REFERENCES `materiais`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `arteiro_peca_materiais_material_idx` ON `arteiro_peca_materiais` (`material_id`);