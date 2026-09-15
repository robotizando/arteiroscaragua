ALTER TABLE `usuarios` ADD `moderador` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `usuarios` ADD `arteiro_verificado` integer DEFAULT false NOT NULL;--> statement-breakpoint
UPDATE `usuarios` SET `moderador` = true WHERE `tipo` = 'moderador';