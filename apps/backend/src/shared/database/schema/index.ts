import { relations } from 'drizzle-orm';

// Identity & access
import { roles } from './roles.schema';
import { users } from './users.schema';
import { refreshTokens } from './refresh-tokens.schema';
import { userAssignments } from './user-assignments.schema';

// Hotel domain
import { hotels } from './hotels.schema';
import { roomTypes } from './room-types.schema';
import { rooms } from './rooms.schema';
import { hotelBookings } from './hotel-bookings.schema';

// Ferry domain
import { ferryRoutes } from './ferry-routes.schema';
import { ferrySchedules } from './ferry-schedules.schema';
import { ferryBookings } from './ferry-bookings.schema';

// Theme park domain
import { parkTicketTypes } from './park-ticket-types.schema';
import { parkTickets } from './park-tickets.schema';
import { events } from './events.schema';
import { eventSchedules } from './event-schedules.schema';
import { eventBookings } from './event-bookings.schema';

// Payments & promotions
import { payments } from './payments.schema';
import { promotions } from './promotions.schema';
import { promotionTargets } from './promotion-targets.schema';
import { promotionUsages } from './promotion-usages.schema';

// Platform & shared
import { images } from './images.schema';
import { imageables } from './imageables.schema';
import { mapLocations } from './map-locations.schema';
import { auditLogs } from './audit-logs.schema';

export * from './roles.schema';
export * from './users.schema';
export * from './refresh-tokens.schema';
export * from './user-assignments.schema';
export * from './hotels.schema';
export * from './room-types.schema';
export * from './rooms.schema';
export * from './hotel-bookings.schema';
export * from './ferry-routes.schema';
export * from './ferry-schedules.schema';
export * from './ferry-bookings.schema';
export * from './park-ticket-types.schema';
export * from './park-tickets.schema';
export * from './park-day-capacities.schema';
export * from './events.schema';
export * from './event-schedules.schema';
export * from './event-bookings.schema';
export * from './payments.schema';
export * from './promotions.schema';
export * from './promotion-targets.schema';
export * from './promotion-usages.schema';
export * from './images.schema';
export * from './imageables.schema';
export * from './map-locations.schema';
export * from './advertisements.schema';
export * from './audit-logs.schema';

// ── Relations ──────────────────────────────────────────────────────────────
// Only unambiguous single links are declared (the relational query API is
// unused so far). Secondary staff FKs (ferry_bookings.validated_by,
// park_tickets.sold_by_user_id) are intentionally omitted to avoid needing
// relationName disambiguation; add per-domain when a module needs them.

export const rolesRelations = relations(roles, ({ many }) => ({
  users: many(users),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  role: one(roles, { fields: [users.roleId], references: [roles.id] }),
  refreshTokens: many(refreshTokens),
}));

export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
  user: one(users, { fields: [refreshTokens.userId], references: [users.id] }),
}));

export const userAssignmentsRelations = relations(
  userAssignments,
  ({ one }) => ({
    user: one(users, {
      fields: [userAssignments.userId],
      references: [users.id],
    }),
  }),
);

export const mapLocationsRelations = relations(mapLocations, ({ many }) => ({
  hotels: many(hotels),
}));

export const hotelsRelations = relations(hotels, ({ one, many }) => ({
  mapLocation: one(mapLocations, {
    fields: [hotels.mapLocationId],
    references: [mapLocations.id],
  }),
  rooms: many(rooms),
}));

export const roomTypesRelations = relations(roomTypes, ({ many }) => ({
  rooms: many(rooms),
}));

export const roomsRelations = relations(rooms, ({ one, many }) => ({
  hotel: one(hotels, { fields: [rooms.hotelId], references: [hotels.id] }),
  roomType: one(roomTypes, {
    fields: [rooms.roomTypeId],
    references: [roomTypes.id],
  }),
  bookings: many(hotelBookings),
}));

export const hotelBookingsRelations = relations(
  hotelBookings,
  ({ one, many }) => ({
    user: one(users, {
      fields: [hotelBookings.userId],
      references: [users.id],
    }),
    hotel: one(hotels, {
      fields: [hotelBookings.hotelId],
      references: [hotels.id],
    }),
    roomType: one(roomTypes, {
      fields: [hotelBookings.roomTypeId],
      references: [roomTypes.id],
    }),
    room: one(rooms, {
      fields: [hotelBookings.roomId],
      references: [rooms.id],
    }),
    ferryBookings: many(ferryBookings),
  }),
);

export const ferryRoutesRelations = relations(ferryRoutes, ({ many }) => ({
  schedules: many(ferrySchedules),
}));

export const ferrySchedulesRelations = relations(
  ferrySchedules,
  ({ one, many }) => ({
    route: one(ferryRoutes, {
      fields: [ferrySchedules.routeId],
      references: [ferryRoutes.id],
    }),
    bookings: many(ferryBookings),
  }),
);

export const ferryBookingsRelations = relations(ferryBookings, ({ one }) => ({
  user: one(users, { fields: [ferryBookings.userId], references: [users.id] }),
  schedule: one(ferrySchedules, {
    fields: [ferryBookings.scheduleId],
    references: [ferrySchedules.id],
  }),
  hotelBooking: one(hotelBookings, {
    fields: [ferryBookings.hotelBookingId],
    references: [hotelBookings.id],
  }),
}));

export const parkTicketTypesRelations = relations(
  parkTicketTypes,
  ({ many }) => ({
    tickets: many(parkTickets),
  }),
);

export const parkTicketsRelations = relations(parkTickets, ({ one, many }) => ({
  user: one(users, { fields: [parkTickets.userId], references: [users.id] }),
  ticketType: one(parkTicketTypes, {
    fields: [parkTickets.ticketTypeId],
    references: [parkTicketTypes.id],
  }),
  eventBookings: many(eventBookings),
}));

export const eventsRelations = relations(events, ({ many }) => ({
  schedules: many(eventSchedules),
}));

export const eventSchedulesRelations = relations(
  eventSchedules,
  ({ one, many }) => ({
    event: one(events, {
      fields: [eventSchedules.eventId],
      references: [events.id],
    }),
    bookings: many(eventBookings),
  }),
);

export const eventBookingsRelations = relations(eventBookings, ({ one }) => ({
  user: one(users, { fields: [eventBookings.userId], references: [users.id] }),
  schedule: one(eventSchedules, {
    fields: [eventBookings.eventScheduleId],
    references: [eventSchedules.id],
  }),
  parkTicket: one(parkTickets, {
    fields: [eventBookings.parkTicketId],
    references: [parkTickets.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  user: one(users, { fields: [payments.userId], references: [users.id] }),
}));

export const promotionsRelations = relations(promotions, ({ many }) => ({
  targets: many(promotionTargets),
  usages: many(promotionUsages),
}));

export const promotionTargetsRelations = relations(
  promotionTargets,
  ({ one }) => ({
    promotion: one(promotions, {
      fields: [promotionTargets.promotionId],
      references: [promotions.id],
    }),
  }),
);

export const promotionUsagesRelations = relations(
  promotionUsages,
  ({ one }) => ({
    promotion: one(promotions, {
      fields: [promotionUsages.promotionId],
      references: [promotions.id],
    }),
    user: one(users, {
      fields: [promotionUsages.userId],
      references: [users.id],
    }),
  }),
);

export const imagesRelations = relations(images, ({ many }) => ({
  imageables: many(imageables),
}));

export const imageablesRelations = relations(imageables, ({ one }) => ({
  image: one(images, {
    fields: [imageables.imageId],
    references: [images.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, { fields: [auditLogs.userId], references: [users.id] }),
}));
