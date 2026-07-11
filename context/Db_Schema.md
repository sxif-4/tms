# Database Schema

## Conventions

These apply across every table below unless a table explicitly notes otherwise:

- **Primary keys** are `bigint`, auto-increment.
- **Timestamps:** mutable entity tables carry `created_at` + `updated_at`. Append-only / log tables (`payments`, `promotion_usages`, `audit_logs`, `images`, `refresh_tokens`) carry only the timestamps that make sense for them.
- **Money** is always `decimal(10,2)` — never floats. Single currency assumed.
- **Enums:** columns shown as `varchar` for `status`, `*_type`, `direction`, `channel`, etc. are backed by **typed enums in Drizzle** (and/or DB enums). They are documented as `varchar` here for readability.
- **Indexes:** every FK column is indexed. Date/datetime columns used for availability and reporting are also indexed: `hotel_bookings.check_in/check_out`, `park_tickets.visit_date`, `ferry_schedules.departure_at`, `event_schedules.start_at`.
- **Business-rule enforcement** that the DB cannot express is done at the application layer: no-overlap (double-booking) checks for rooms, and capacity checks for ferries/events (summing `passenger_count` / `quantity` against `capacity`).
- **Price snapshots:** bookings/tickets store a `total_amount` captured at purchase time. Reports and receipts reflect what was actually charged, not today's `base_price` (which can change).

---

## 🔐 IDENTITY & ACCESS

> RBAC model: a user has exactly **one role** (`users.role_id`), which grants a capability (e.g. `hotel_staff`). For staff whose authority is scoped to specific entities, the role is combined with **`user_assignments`** (see below) — the role says _what_ they can do, the assignment says _which_ hotels/routes/etc. they can do it to. Fine-grained permission-per-role is kept in application code, not in the database.

### roles

| Column     | Type         | Constraints   | Description                                                        |
| ---------- | ------------ | ------------- | ------------------------------------------------------------------ |
| id         | bigint       | PK, increment | Primary key                                                        |
| name       | varchar(100) | -             | Human-readable name (e.g. "Hotel Staff")                           |
| slug       | varchar(50)  | UNIQUE        | Machine slug: visitor, hotel_staff, ferry_staff, park_staff, admin |
| created_at | timestamp    | -             | Record creation time                                               |
| updated_at | timestamp    | -             | Record update time                                                 |

### users

| Column            | Type         | Constraints   | Description                                      |
| ----------------- | ------------ | ------------- | ------------------------------------------------ |
| id                | bigint       | PK, increment | Primary key                                      |
| name              | varchar(255) | -             | Full name                                        |
| email             | varchar(255) | UNIQUE        | Login email                                      |
| password_hash     | varchar(255) | -             | bcrypt/argon2 hash — never store raw             |
| role_id           | bigint       | FK → roles.id | User's role (single role per user)               |
| phone             | varchar(30)  | nullable      | Optional contact number                          |
| email_verified_at | timestamp    | nullable      | Set when email is verified (null = unverified)   |
| is_active         | boolean      | default true  | Admin can deactivate an account without deleting |
| created_at        | timestamp    | -             | Record creation time                             |
| updated_at        | timestamp    | -             | Record update time                               |

### refresh_tokens

> Optional — include only if you want server-side logout / token revocation. Skip if access tokens are short-lived and stateless.

| Column     | Type         | Constraints                   | Description                      |
| ---------- | ------------ | ----------------------------- | -------------------------------- |
| id         | bigint       | PK, increment                 | Primary key                      |
| user_id    | bigint       | FK → users.id, cascade delete | Token owner                      |
| token_hash | varchar(255) | UNIQUE                        | Hashed refresh token — never raw |
| expires_at | timestamp    | -                             | Expiry time                      |
| revoked_at | timestamp    | nullable                      | Set on logout / rotation         |
| created_at | timestamp    | -                             | Record creation time             |

---

## 🏨 HOTEL DOMAIN

### hotels

| Column          | Type         | Constraints                     | Description               |
| --------------- | ------------ | ------------------------------- | ------------------------- |
| id              | bigint       | PK, increment                   | Primary key               |
| name            | varchar(255) | -                               | Hotel name                |
| description     | text         | nullable                        | Hotel description         |
| map_location_id | bigint       | FK → map_locations.id, nullable | Reference to map location |
| max_rooms       | int unsigned | -                               | Maximum number of rooms   |
| created_at      | timestamp    | -                               | Record creation time      |
| updated_at      | timestamp    | -                               | Record update time        |

### room_types

| Column               | Type          | Constraints   | Description              |
| -------------------- | ------------- | ------------- | ------------------------ |
| id                   | bigint        | PK, increment | Primary key              |
| name                 | varchar(255)  | -             | Room type name           |
| description          | text          | -             | Detailed description     |
| base_price_per_night | decimal(10,2) | -             | Base price per night     |
| max_occupancy        | tinyint       | -             | Maximum number of guests |
| created_at           | timestamp     | -             | Record creation time     |
| updated_at           | timestamp     | -             | Record update time       |

### rooms

| Column       | Type        | Constraints                    | Description                  |
| ------------ | ----------- | ------------------------------ | ---------------------------- |
| id           | bigint      | PK, increment                  | Primary key                  |
| hotel_id     | bigint      | FK → hotels.id, cascade delete | Hotel this room belongs to   |
| room_type_id | bigint      | FK → room_types.id             | Reference to room type       |
| room_number  | varchar(20) | UNIQUE(hotel_id, room_number)  | Room number within the hotel |
| status       | varchar(50) | -                              | Room status (available, etc) |
| created_at   | timestamp   | -                              | Record creation time         |
| updated_at   | timestamp   | -                              | Record update time           |

### hotel_bookings

Room-type-first: guests/staff pick a **room type** + dates at booking time; a specific room is assigned by staff afterward (`room_id` starts `NULL`), which makes "unassigned room" a real, queryable operational state. Availability is a capacity count, not a per-room overlap check: for a hotel + room type + date range, `available = (rooms of that type, status IN ('available','occupied')) − (hotel_bookings for that hotel+room type, status != 'cancelled', overlapping the range)`.

| Column            | Type          | Constraints              | Description                                               |
| ----------------- | ------------- | ------------------------- | ---------------------------------------------------------- |
| id                | bigint        | PK, increment             | Primary key                                                |
| booking_reference | varchar(20)   | UNIQUE                    | Unique booking reference                                   |
| user_id           | bigint        | FK → users.id             | User who made the booking                                  |
| hotel_id          | bigint        | FK → hotels.id            | Booked hotel                                                |
| room_type_id      | bigint        | FK → room_types.id        | Booked room type                                            |
| room_id           | bigint        | FK → rooms.id, nullable   | Specific room, assigned by staff after booking (nullable)  |
| check_in          | date          | -                          | Check-in date                                               |
| check_out         | date          | -                          | Check-out date                                              |
| guests            | tinyint       | -                          | Number of guests                                            |
| total_amount      | decimal(10,2) | -                          | Price snapshot at booking time                              |
| status            | varchar(50)   | -                          | Booking status (pending, confirmed, cancelled, completed)  |
| created_at        | timestamp     | -                          | Record creation time                                        |
| updated_at        | timestamp     | -                          | Record update time                                          |

## ⛴️ FERRY DOMAIN

### ferry_routes

| Column      | Type         | Constraints   | Description                           |
| ----------- | ------------ | ------------- | ------------------------------------- |
| id          | bigint       | PK, increment | Primary key                           |
| name        | varchar(100) | -             | Route name e.g. "Island ↔ Theme Park" |
| origin      | varchar(100) | -             | Origin location                       |
| destination | varchar(100) | -             | Destination location                  |
| created_at  | timestamp    | -             | Record creation time                  |
| updated_at  | timestamp    | -             | Record update time                    |

### ferry_schedules

| Column       | Type          | Constraints          | Description               |
| ------------ | ------------- | -------------------- | ------------------------- |
| id           | bigint        | PK, increment        | Primary key               |
| route_id     | bigint        | FK → ferry_routes.id | Reference to ferry route  |
| departure_at | datetime      | -                    | Departure date and time   |
| direction    | varchar(20)   | -                    | to_theme_park / to_island |
| capacity     | int           | -                    | Maximum passengers        |
| base_price   | decimal(10,2) | -                    | Base price per ticket     |
| status       | varchar(50)   | -                    | Schedule status           |
| created_at   | timestamp     | -                    | Record creation time      |
| updated_at   | timestamp     | -                    | Record update time        |

### ferry_bookings

| Column            | Type          | Constraints             | Description                                     |
| ----------------- | ------------- | ----------------------- | ----------------------------------------------- |
| id                | bigint        | PK, increment           | Primary key                                     |
| booking_reference | varchar(20)   | UNIQUE                  | Unique booking reference                        |
| user_id           | bigint        | FK → users.id           | User who booked                                 |
| schedule_id       | bigint        | FK → ferry_schedules.id | Ferry schedule                                  |
| hotel_booking_id  | bigint        | FK → hotel_bookings.id  | Linked hotel booking (enforces valid-stay rule) |
| passenger_count   | tinyint       | -                       | Number of passengers                            |
| total_amount      | decimal(10,2) | -                       | Price snapshot at booking time                  |
| validated_by      | bigint        | FK → users.id, nullable | Ferry operator who validated/issued the pass    |
| validated_at      | timestamp     | nullable                | When the pass was validated/issued              |
| status            | varchar(50)   | -                       | Booking status                                  |
| created_at        | timestamp     | -                       | Record creation time                            |
| updated_at        | timestamp     | -                       | Record update time                              |

## 🎢 THEME PARK DOMAIN

### park_ticket_types

| Column     | Type          | Constraints   | Description          |
| ---------- | ------------- | ------------- | -------------------- |
| id         | bigint        | PK, increment | Primary key          |
| name       | varchar(255)  | -             | Ticket type name     |
| price      | decimal(10,2) | -             | Ticket price         |
| created_at | timestamp     | -             | Record creation time |
| updated_at | timestamp     | -             | Record update time   |

### park_tickets

| Column           | Type          | Constraints               | Description                                    |
| ---------------- | ------------- | ------------------------- | ---------------------------------------------- |
| id               | bigint        | PK, increment             | Primary key                                    |
| ticket_reference | varchar(20)   | UNIQUE                    | Unique ticket reference                        |
| user_id          | bigint        | FK → users.id             | Ticket owner                                   |
| ticket_type_id   | bigint        | FK → park_ticket_types.id | Type of ticket                                 |
| visit_date       | date          | -                         | Date of visit                                  |
| quantity         | tinyint       | -                         | Number of tickets                              |
| total_amount     | decimal(10,2) | -                         | Price snapshot at purchase time                |
| channel          | varchar(20)   | -                         | Sales channel: online / gate                   |
| sold_by_user_id  | bigint        | FK → users.id, nullable   | Staff who sold it (gate sales); null if online |
| status           | varchar(50)   | -                         | Ticket status                                  |
| created_at       | timestamp     | -                         | Record creation time                           |
| updated_at       | timestamp     | -                         | Record update time                             |

### events

| Column        | Type          | Constraints   | Description             |
| ------------- | ------------- | ------------- | ----------------------- |
| id            | bigint        | PK, increment | Primary key             |
| name          | varchar(255)  | -             | Event name              |
| description   | text          | -             | Event description       |
| event_type    | varchar(50)   | -             | ride, show, beach_event |
| location_type | varchar(50)   | -             | theme_park, beach       |
| base_price    | decimal(10,2) | -             | Base price              |
| is_active     | boolean       | -             | Whether event is active |
| created_at    | timestamp     | -             | Record creation time    |
| updated_at    | timestamp     | -             | Record update time      |

### event_schedules

| Column     | Type      | Constraints    | Description          |
| ---------- | --------- | -------------- | -------------------- |
| id         | bigint    | PK, increment  | Primary key          |
| event_id   | bigint    | FK → events.id | Reference to event   |
| start_at   | datetime  | -              | Start date and time  |
| capacity   | int       | -              | Maximum capacity     |
| created_at | timestamp | -              | Record creation time |
| updated_at | timestamp | -              | Record update time   |

### event_bookings

| Column            | Type          | Constraints             | Description                               |
| ----------------- | ------------- | ----------------------- | ----------------------------------------- |
| id                | bigint        | PK, increment           | Primary key                               |
| booking_reference | varchar(20)   | UNIQUE                  | Unique booking reference                  |
| user_id           | bigint        | FK → users.id           | User who booked                           |
| event_schedule_id | bigint        | FK → event_schedules.id | Scheduled event                           |
| park_ticket_id    | bigint        | FK → park_tickets.id    | Linked park ticket (enforces ticket rule) |
| quantity          | tinyint       | -                       | Number of tickets                         |
| total_amount      | decimal(10,2) | -                       | Price snapshot at booking time            |
| status            | varchar(50)   | -                       | Booking status                            |
| created_at        | timestamp     | -                       | Record creation time                      |
| updated_at        | timestamp     | -                       | Record update time                        |

## 💰 PAYMENTS

### payments

| Column            | Type          | Constraints   | Description                                              |
| ----------------- | ------------- | ------------- | -------------------------------------------------------- |
| id                | bigint        | PK, increment | Primary key                                              |
| user_id           | bigint        | FK → users.id | User who paid                                            |
| payable_type      | varchar(50)   | -             | hotel_booking, ferry_booking, event_booking, park_ticket |
| payable_id        | bigint        | -             | ID of the related booking                                |
| amount            | decimal(10,2) | -             | Payment amount                                           |
| status            | varchar(50)   | -             | pending, completed, failed, refunded                     |
| method            | varchar(50)   | -             | Payment method (card, cash, etc.)                        |
| payment_reference | char(36)      | -             | Unique payment reference                                 |
| paid_at           | timestamp     | nullable      | Payment completion time (null until paid)                |
| created_at        | timestamp     | -             | Record creation time                                     |
| updated_at        | timestamp     | -             | Record update time                                       |

## 🎁 PROMOTIONS ENGINE

### promotions

| Column         | Type          | Constraints      | Description                                         |
| -------------- | ------------- | ---------------- | --------------------------------------------------- |
| id             | bigint        | PK, increment    | Primary key                                         |
| name           | varchar(255)  | -                | Promotion name                                      |
| description    | text          | -                | Promotion description                               |
| code           | varchar(50)   | UNIQUE, nullable | Coupon code for customer entry; null = auto-applied |
| discount_type  | varchar(20)   | -                | percentage or fixed                                 |
| discount_value | decimal(10,2) | -                | Discount value                                      |
| min_spend      | decimal(10,2) | nullable         | Minimum order amount to qualify                     |
| usage_limit    | int unsigned  | nullable         | Global redemption cap; null = unlimited             |
| per_user_limit | int unsigned  | nullable         | Per-user redemption cap; null = unlimited           |
| valid_from     | datetime      | -                | Valid from                                          |
| valid_to       | datetime      | -                | Valid until                                         |
| is_active      | boolean       | -                | Active status                                       |
| created_at     | timestamp     | -                | Record creation time                                |
| updated_at     | timestamp     | -                | Record update time                                  |

### promotion_targets

| Column       | Type        | Constraints        | Description                   |
| ------------ | ----------- | ------------------ | ----------------------------- |
| id           | bigint      | PK, increment      | Primary key                   |
| promotion_id | bigint      | FK → promotions.id | Reference to promotion        |
| target_type  | varchar(50) | -                  | room_type, event, ferry_route |
| target_id    | bigint      | -                  | ID of the target entity       |

### promotion_usages

| Column          | Type          | Constraints        | Description                       |
| --------------- | ------------- | ------------------ | --------------------------------- |
| id              | bigint        | PK, increment      | Primary key                       |
| promotion_id    | bigint        | FK → promotions.id | Promotion used                    |
| user_id         | bigint        | FK → users.id      | User who used it                  |
| applied_to_type | varchar(50)   | -                  | hotel_booking, ferry_booking, etc |
| applied_to_id   | bigint        | -                  | ID of the booking applied to      |
| discount_amount | decimal(10,2) | -                  | Actual discount given             |
| created_at      | timestamp     | -                  | When usage was recorded           |

## 🖼️ REUSABLE IMAGE SYSTEM (Polymorphic)

### images

| Column     | Type         | Constraints   | Description        |
| ---------- | ------------ | ------------- | ------------------ |
| id         | bigint       | PK, increment | Primary key        |
| url        | varchar(500) | -             | Image URL          |
| created_at | timestamp    | -             | Creation timestamp |

### imageables

| Column         | Type        | Constraints    | Description                     |
| -------------- | ----------- | -------------- | ------------------------------- |
| image_id       | bigint      | FK → images.id | Reference to image              |
| imageable_id   | bigint      | -              | ID of the related entity        |
| imageable_type | varchar(50) | -              | room, event, advertisement, etc |

**Note:** Composite Primary Key on `(image_id, imageable_id, imageable_type)`

## 👥 USER ASSIGNMENTS

### user_assignments

> Scopes a staff user to the specific entities they manage. Works together with `users.role_id`: the role grants the capability (e.g. `hotel_staff`), this table restricts it to specific instances (e.g. Hotel #3). Checked at the application layer via an ownership guard.

| Column          | Type        | Constraints                   | Description                  |
| --------------- | ----------- | ----------------------------- | ---------------------------- |
| id              | bigint      | PK, increment                 | Primary key                  |
| user_id         | bigint      | FK → users.id, cascade delete | Assigned user                |
| assignable_type | varchar(50) | -                             | Type of entity (e.g. Hotel)  |
| assignable_id   | bigint      | -                             | ID of the assigned entity    |
| created_at      | timestamp   | -                             | When the assignment was made |

**Note:** Unique constraint on `(user_id, assignable_type, assignable_id)`

## 📍 PLATFORM

### map_locations

| Column      | Type          | Constraints   | Description          |
| ----------- | ------------- | ------------- | -------------------- |
| id          | bigint        | PK, increment | Primary key          |
| name        | varchar(255)  | -             | Location name        |
| description | text          | -             | Description          |
| type        | varchar(50)   | -             | Location type        |
| latitude    | decimal(10,7) | -             | Latitude coordinate  |
| longitude   | decimal(10,7) | -             | Longitude coordinate |
| created_at  | timestamp     | -             | Record creation time |
| updated_at  | timestamp     | -             | Record update time   |

### advertisements

> **Note:** Ads keep a denormalized `image` URL for simplicity rather than using the polymorphic `images`/`imageables` system. This is the one intentional exception to the shared image system.

| Column     | Type         | Constraints   | Description          |
| ---------- | ------------ | ------------- | -------------------- |
| id         | bigint       | PK, increment | Primary key          |
| title      | varchar(255) | -             | Advertisement title  |
| image      | varchar(500) | -             | Image URL            |
| target_url | varchar(500) | -             | URL to redirect      |
| placement  | varchar(50)  | -             | Placement location   |
| starts_at  | date         | -             | Start date           |
| ends_at    | date         | -             | End date             |
| is_active  | boolean      | -             | Active status        |
| created_at | timestamp    | -             | Record creation time |
| updated_at | timestamp    | -             | Record update time   |

## 🧾 AUDIT LOGS

### audit_logs

| Column       | Type         | Constraints   | Description                  |
| ------------ | ------------ | ------------- | ---------------------------- |
| id           | bigint       | PK, increment | Primary key                  |
| user_id      | bigint       | FK → users.id | User who performed action    |
| action       | varchar(100) | -             | Action performed             |
| subject_type | varchar(255) | -             | Type of subject (model name) |
| subject_id   | bigint       | -             | ID of the subject            |
| metadata     | json         | -             | Additional metadata          |
| created_at   | timestamp    | -             | Log creation timestamp       |
