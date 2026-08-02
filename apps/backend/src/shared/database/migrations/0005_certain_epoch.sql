CREATE TABLE `facilities` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`icon` text,
	`category` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `facilities_name_unique` ON `facilities` (`name`);--> statement-breakpoint
CREATE TABLE `hotel_facilities` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`hotel_id` integer NOT NULL,
	`facility_id` integer NOT NULL,
	FOREIGN KEY (`hotel_id`) REFERENCES `hotels`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`facility_id`) REFERENCES `facilities`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `hotel_facilities_unique` ON `hotel_facilities` (`hotel_id`,`facility_id`);--> statement-breakpoint
CREATE INDEX `hotel_facilities_hotel_id_idx` ON `hotel_facilities` (`hotel_id`);