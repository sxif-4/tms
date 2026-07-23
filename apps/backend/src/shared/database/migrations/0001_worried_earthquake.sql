CREATE TABLE `park_day_capacities` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` integer NOT NULL,
	`capacity` integer NOT NULL,
	`is_closed` integer DEFAULT false NOT NULL,
	`note` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `park_day_capacities_date_unique` ON `park_day_capacities` (`date`);