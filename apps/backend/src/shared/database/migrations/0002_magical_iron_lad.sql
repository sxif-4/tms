CREATE TABLE `amenities` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`icon` text,
	`category` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `amenities_name_unique` ON `amenities` (`name`);--> statement-breakpoint
CREATE TABLE `room_type_amenities` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`room_type_id` integer NOT NULL,
	`amenity_id` integer NOT NULL,
	FOREIGN KEY (`room_type_id`) REFERENCES `room_types`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`amenity_id`) REFERENCES `amenities`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `room_type_amenities_unique` ON `room_type_amenities` (`room_type_id`,`amenity_id`);