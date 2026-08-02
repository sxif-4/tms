-- Room types become per-hotel. SQLite can't ADD a NOT NULL column carrying a
-- foreign key, so this is the standard table rebuild rather than an ALTER.
--
-- Backfill is best-effort: each previously-global room type is attached to the
-- first hotel that stocks rooms of it (or the lowest hotel id if none do). On a
-- fresh database the table is empty and nothing is copied. Existing rooms at
-- *other* hotels keep pointing at the type — the database stays referentially
-- valid, but re-seed for a coherent data set.
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_room_types` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`hotel_id` integer NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`base_price_per_night` text NOT NULL,
	`max_occupancy` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`hotel_id`) REFERENCES `hotels`(`id`) ON UPDATE no action ON DELETE cascade
);--> statement-breakpoint
INSERT INTO `__new_room_types` (`id`, `hotel_id`, `name`, `description`, `base_price_per_night`, `max_occupancy`, `created_at`, `updated_at`)
SELECT
	`rt`.`id`,
	COALESCE(
		(SELECT MIN(`r`.`hotel_id`) FROM `rooms` `r` WHERE `r`.`room_type_id` = `rt`.`id`),
		(SELECT MIN(`id`) FROM `hotels`)
	),
	`rt`.`name`,
	`rt`.`description`,
	`rt`.`base_price_per_night`,
	`rt`.`max_occupancy`,
	`rt`.`created_at`,
	`rt`.`updated_at`
FROM `room_types` `rt`
WHERE EXISTS (SELECT 1 FROM `hotels`);--> statement-breakpoint
DROP TABLE `room_types`;--> statement-breakpoint
ALTER TABLE `__new_room_types` RENAME TO `room_types`;--> statement-breakpoint
CREATE UNIQUE INDEX `room_types_hotel_id_name_unique` ON `room_types` (`hotel_id`,`name`);--> statement-breakpoint
CREATE INDEX `room_types_hotel_id_idx` ON `room_types` (`hotel_id`);--> statement-breakpoint
PRAGMA foreign_keys=ON;
