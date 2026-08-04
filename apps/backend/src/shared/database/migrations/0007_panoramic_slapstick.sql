ALTER TABLE `hotel_bookings` ADD `channel` text DEFAULT 'online' NOT NULL;--> statement-breakpoint
ALTER TABLE `hotel_bookings` ADD `sold_by_user_id` integer REFERENCES users(id);