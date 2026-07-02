CREATE TABLE `user_assignments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`assignable_type` text NOT NULL,
	`assignable_id` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_assignments_unique` ON `user_assignments` (`user_id`,`assignable_type`,`assignable_id`);--> statement-breakpoint
CREATE TABLE `hotels` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`map_location_id` integer,
	`max_rooms` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`map_location_id`) REFERENCES `map_locations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `hotels_map_location_id_idx` ON `hotels` (`map_location_id`);--> statement-breakpoint
CREATE TABLE `room_types` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`base_price_per_night` text NOT NULL,
	`max_occupancy` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `rooms` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`hotel_id` integer NOT NULL,
	`room_type_id` integer NOT NULL,
	`room_number` text NOT NULL,
	`status` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`hotel_id`) REFERENCES `hotels`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`room_type_id`) REFERENCES `room_types`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `rooms_hotel_id_room_number_unique` ON `rooms` (`hotel_id`,`room_number`);--> statement-breakpoint
CREATE INDEX `rooms_room_type_id_idx` ON `rooms` (`room_type_id`);--> statement-breakpoint
CREATE TABLE `hotel_bookings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`booking_reference` text NOT NULL,
	`user_id` integer NOT NULL,
	`room_id` integer NOT NULL,
	`check_in` integer NOT NULL,
	`check_out` integer NOT NULL,
	`guests` integer NOT NULL,
	`total_amount` text NOT NULL,
	`status` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `hotel_bookings_booking_reference_unique` ON `hotel_bookings` (`booking_reference`);--> statement-breakpoint
CREATE INDEX `hotel_bookings_user_id_idx` ON `hotel_bookings` (`user_id`);--> statement-breakpoint
CREATE INDEX `hotel_bookings_room_id_idx` ON `hotel_bookings` (`room_id`);--> statement-breakpoint
CREATE INDEX `hotel_bookings_check_in_idx` ON `hotel_bookings` (`check_in`);--> statement-breakpoint
CREATE INDEX `hotel_bookings_check_out_idx` ON `hotel_bookings` (`check_out`);--> statement-breakpoint
CREATE TABLE `ferry_routes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`origin` text NOT NULL,
	`destination` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `ferry_schedules` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`route_id` integer NOT NULL,
	`departure_at` integer NOT NULL,
	`direction` text NOT NULL,
	`capacity` integer NOT NULL,
	`base_price` text NOT NULL,
	`status` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`route_id`) REFERENCES `ferry_routes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `ferry_schedules_route_id_idx` ON `ferry_schedules` (`route_id`);--> statement-breakpoint
CREATE INDEX `ferry_schedules_departure_at_idx` ON `ferry_schedules` (`departure_at`);--> statement-breakpoint
CREATE TABLE `ferry_bookings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`booking_reference` text NOT NULL,
	`user_id` integer NOT NULL,
	`schedule_id` integer NOT NULL,
	`hotel_booking_id` integer NOT NULL,
	`passenger_count` integer NOT NULL,
	`total_amount` text NOT NULL,
	`validated_by` integer,
	`validated_at` integer,
	`status` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`schedule_id`) REFERENCES `ferry_schedules`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`hotel_booking_id`) REFERENCES `hotel_bookings`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`validated_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ferry_bookings_booking_reference_unique` ON `ferry_bookings` (`booking_reference`);--> statement-breakpoint
CREATE INDEX `ferry_bookings_user_id_idx` ON `ferry_bookings` (`user_id`);--> statement-breakpoint
CREATE INDEX `ferry_bookings_schedule_id_idx` ON `ferry_bookings` (`schedule_id`);--> statement-breakpoint
CREATE INDEX `ferry_bookings_hotel_booking_id_idx` ON `ferry_bookings` (`hotel_booking_id`);--> statement-breakpoint
CREATE TABLE `park_ticket_types` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`price` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `park_tickets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`ticket_reference` text NOT NULL,
	`user_id` integer NOT NULL,
	`ticket_type_id` integer NOT NULL,
	`visit_date` integer NOT NULL,
	`quantity` integer NOT NULL,
	`total_amount` text NOT NULL,
	`channel` text NOT NULL,
	`sold_by_user_id` integer,
	`status` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`ticket_type_id`) REFERENCES `park_ticket_types`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`sold_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `park_tickets_ticket_reference_unique` ON `park_tickets` (`ticket_reference`);--> statement-breakpoint
CREATE INDEX `park_tickets_user_id_idx` ON `park_tickets` (`user_id`);--> statement-breakpoint
CREATE INDEX `park_tickets_ticket_type_id_idx` ON `park_tickets` (`ticket_type_id`);--> statement-breakpoint
CREATE INDEX `park_tickets_visit_date_idx` ON `park_tickets` (`visit_date`);--> statement-breakpoint
CREATE TABLE `events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`event_type` text NOT NULL,
	`location_type` text NOT NULL,
	`base_price` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `event_schedules` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`event_id` integer NOT NULL,
	`start_at` integer NOT NULL,
	`capacity` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `event_schedules_event_id_idx` ON `event_schedules` (`event_id`);--> statement-breakpoint
CREATE INDEX `event_schedules_start_at_idx` ON `event_schedules` (`start_at`);--> statement-breakpoint
CREATE TABLE `event_bookings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`booking_reference` text NOT NULL,
	`user_id` integer NOT NULL,
	`event_schedule_id` integer NOT NULL,
	`park_ticket_id` integer NOT NULL,
	`quantity` integer NOT NULL,
	`total_amount` text NOT NULL,
	`status` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`event_schedule_id`) REFERENCES `event_schedules`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`park_ticket_id`) REFERENCES `park_tickets`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `event_bookings_booking_reference_unique` ON `event_bookings` (`booking_reference`);--> statement-breakpoint
CREATE INDEX `event_bookings_user_id_idx` ON `event_bookings` (`user_id`);--> statement-breakpoint
CREATE INDEX `event_bookings_event_schedule_id_idx` ON `event_bookings` (`event_schedule_id`);--> statement-breakpoint
CREATE INDEX `event_bookings_park_ticket_id_idx` ON `event_bookings` (`park_ticket_id`);--> statement-breakpoint
CREATE TABLE `payments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`payable_type` text NOT NULL,
	`payable_id` integer NOT NULL,
	`amount` text NOT NULL,
	`status` text NOT NULL,
	`method` text NOT NULL,
	`payment_reference` text NOT NULL,
	`paid_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `payments_user_id_idx` ON `payments` (`user_id`);--> statement-breakpoint
CREATE INDEX `payments_payable_idx` ON `payments` (`payable_type`,`payable_id`);--> statement-breakpoint
CREATE TABLE `promotions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`code` text,
	`discount_type` text NOT NULL,
	`discount_value` text NOT NULL,
	`min_spend` text,
	`usage_limit` integer,
	`per_user_limit` integer,
	`valid_from` integer NOT NULL,
	`valid_to` integer NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `promotions_code_unique` ON `promotions` (`code`);--> statement-breakpoint
CREATE TABLE `promotion_targets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`promotion_id` integer NOT NULL,
	`target_type` text NOT NULL,
	`target_id` integer NOT NULL,
	FOREIGN KEY (`promotion_id`) REFERENCES `promotions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `promotion_targets_promotion_id_idx` ON `promotion_targets` (`promotion_id`);--> statement-breakpoint
CREATE TABLE `promotion_usages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`promotion_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	`applied_to_type` text NOT NULL,
	`applied_to_id` integer NOT NULL,
	`discount_amount` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`promotion_id`) REFERENCES `promotions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `promotion_usages_promotion_id_idx` ON `promotion_usages` (`promotion_id`);--> statement-breakpoint
CREATE INDEX `promotion_usages_user_id_idx` ON `promotion_usages` (`user_id`);--> statement-breakpoint
CREATE TABLE `images` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`url` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `imageables` (
	`image_id` integer NOT NULL,
	`imageable_id` integer NOT NULL,
	`imageable_type` text NOT NULL,
	PRIMARY KEY(`image_id`, `imageable_id`, `imageable_type`),
	FOREIGN KEY (`image_id`) REFERENCES `images`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `map_locations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`type` text NOT NULL,
	`latitude` text NOT NULL,
	`longitude` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `advertisements` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`image` text NOT NULL,
	`target_url` text NOT NULL,
	`placement` text NOT NULL,
	`starts_at` integer NOT NULL,
	`ends_at` integer NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`action` text NOT NULL,
	`subject_type` text NOT NULL,
	`subject_id` integer NOT NULL,
	`metadata` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `audit_logs_user_id_idx` ON `audit_logs` (`user_id`);