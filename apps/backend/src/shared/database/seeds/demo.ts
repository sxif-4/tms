import * as bcrypt from 'bcrypt';
import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from '../schema';
import {
  advertisements,
  auditLogs,
  eventBookings,
  eventSchedules,
  events,
  ferryBookings,
  ferryRoutes,
  ferrySchedules,
  hotelBookings,
  hotels,
  imageables,
  images,
  mapLocations,
  parkTicketTypes,
  parkTickets,
  payments,
  promotionTargets,
  promotionUsages,
  promotions,
  roles,
  roomTypes,
  rooms,
  userAssignments,
  users,
  type NewPayment,
} from '../schema';

type DemoDb = BetterSQLite3Database<typeof schema>;

const DAY = 86_400_000;
const now = Date.now();
/** A Date `days` from now (negative = past), keeping the current time of day. */
const at = (days: number) => new Date(now + days * DAY);
const ref = (prefix: string, n: number) =>
  `${prefix}-${String(n).padStart(4, '0')}`;

/** Maps a booking/ticket status to the status of its payment. */
function paymentStatusFor(s: string): 'completed' | 'pending' | 'refunded' {
  if (s === 'pending') return 'pending';
  if (s === 'cancelled' || s === 'refunded') return 'refunded';
  return 'completed';
}

/**
 * Seeds a rich, self-consistent set of mock data across every domain so the
 * upcoming reports/analytics work has real numbers to aggregate. Idempotent:
 * bails if any hotels already exist. No business rules are enforced here — this
 * is illustrative demo data only.
 */
export async function seedDemo(db: DemoDb): Promise<void> {
  if (db.select({ id: hotels.id }).from(hotels).get()) {
    console.log('ℹ️  Demo data already present — skipping demo seed');
    return;
  }

  // ── Visitor accounts (owners of the bookings below) ──────────────────────
  const visitorRole = db
    .select()
    .from(roles)
    .where(eq(roles.slug, 'visitor'))
    .get();
  if (!visitorRole) throw new Error('visitor role missing — run role seed');

  const password = process.env.STAFF_PASSWORD ?? 'ChangeMe123!';
  const passwordHash = await bcrypt.hash(password, 12);
  const [alice, bob, carol] = db
    .insert(users)
    .values(
      [
        { name: 'Alice Turner', email: 'alice@example.com', phone: '555-0101' },
        { name: 'Bob Ferris', email: 'bob@example.com', phone: '555-0102' },
        { name: 'Carol Nguyen', email: 'carol@example.com', phone: '555-0103' },
      ].map((u) => ({ ...u, passwordHash, roleId: visitorRole.id })),
    )
    .returning()
    .all();

  const staff = (email: string) => {
    const u = db.select().from(users).where(eq(users.email, email)).get();
    if (!u) throw new Error(`expected seeded staff ${email}`);
    return u;
  };
  const admin = staff('admin@example.com');
  const hotelStaff = staff('hotel@example.com');
  const ferryStaff = staff('ferry@example.com');
  const parkStaff = staff('park@example.com');

  // ── Map locations ────────────────────────────────────────────────────────
  const [grandLoc, seasideLoc, , , beachLoc] = db
    .insert(mapLocations)
    .values([
      {
        name: 'Grand Island Hotel',
        description: 'Flagship hotel on the main island.',
        type: 'hotel',
        positionTop: '38.00',
        positionLeft: '52.00',
      },
      {
        name: 'Seaside Resort',
        description: 'Beachfront resort near the ferry dock.',
        type: 'hotel',
        positionTop: '22.00',
        positionLeft: '38.00',
      },
      {
        name: 'North Ferry Terminal',
        description: 'Departure point on the main island.',
        type: 'ferry_terminal',
        positionTop: '36.00',
        positionLeft: '56.00',
      },
      {
        name: 'Theme Park Ferry Dock',
        description: 'Arrival dock on the theme-park island.',
        type: 'ferry_terminal',
        positionTop: '15.00',
        positionLeft: '85.00',
      },
      {
        name: 'Sunset Beach',
        description: 'Popular picnic and beach-event spot.',
        type: 'beach',
        positionTop: '16.00',
        positionLeft: '42.00',
      },
      {
        name: 'Thrill Coaster Plaza',
        description: 'Main attraction square in the theme park.',
        type: 'attraction',
        positionTop: '50.00',
        positionLeft: '30.00',
      },
    ])
    .returning()
    .all();

  // ── Hotel domain ─────────────────────────────────────────────────────────
  const [grand, seaside] = db
    .insert(hotels)
    .values([
      {
        name: 'Grand Island Hotel',
        description: 'Five-star stay in the island centre.',
        mapLocationId: grandLoc.id,
        maxRooms: 50,
      },
      {
        name: 'Seaside Resort',
        description: 'Relaxed beachfront rooms and suites.',
        mapLocationId: seasideLoc.id,
        maxRooms: 30,
      },
    ])
    .returning()
    .all();

  const [standard, deluxe, suite] = db
    .insert(roomTypes)
    .values([
      {
        name: 'Standard',
        description: 'Cosy room with a queen bed.',
        basePricePerNight: '120.00',
        maxOccupancy: 2,
      },
      {
        name: 'Deluxe',
        description: 'Spacious room with sea view.',
        basePricePerNight: '200.00',
        maxOccupancy: 3,
      },
      {
        name: 'Suite',
        description: 'Premium suite with lounge.',
        basePricePerNight: '350.00',
        maxOccupancy: 4,
      },
    ])
    .returning()
    .all();

  const [g101, g102, g201, g301, s101, s102, s201] = db
    .insert(rooms)
    .values([
      {
        hotelId: grand.id,
        roomTypeId: standard.id,
        roomNumber: '101',
        status: 'available',
      },
      {
        hotelId: grand.id,
        roomTypeId: standard.id,
        roomNumber: '102',
        status: 'available',
      },
      {
        hotelId: grand.id,
        roomTypeId: deluxe.id,
        roomNumber: '201',
        status: 'occupied',
      },
      {
        hotelId: grand.id,
        roomTypeId: suite.id,
        roomNumber: '301',
        status: 'available',
      },
      {
        hotelId: seaside.id,
        roomTypeId: standard.id,
        roomNumber: '101',
        status: 'available',
      },
      {
        hotelId: seaside.id,
        roomTypeId: deluxe.id,
        roomNumber: '102',
        status: 'maintenance',
      },
      {
        hotelId: seaside.id,
        roomTypeId: suite.id,
        roomNumber: '201',
        status: 'available',
      },
    ])
    .returning()
    .all();
  void g102;
  void s102;

  const hotelBookingRows = db
    .insert(hotelBookings)
    .values([
      {
        bookingReference: ref('HB', 1),
        userId: alice.id,
        hotelId: grand.id,
        roomTypeId: standard.id,
        roomId: g101.id,
        checkIn: at(-10),
        checkOut: at(-7),
        guests: 2,
        totalAmount: '360.00',
        status: 'completed',
      },
      {
        bookingReference: ref('HB', 2),
        userId: bob.id,
        hotelId: grand.id,
        roomTypeId: deluxe.id,
        roomId: g201.id,
        checkIn: at(-3),
        checkOut: at(1),
        guests: 2,
        totalAmount: '800.00',
        status: 'confirmed',
      },
      {
        bookingReference: ref('HB', 3),
        userId: carol.id,
        hotelId: seaside.id,
        roomTypeId: suite.id,
        roomId: s201.id,
        checkIn: at(5),
        checkOut: at(9),
        guests: 3,
        totalAmount: '1400.00',
        status: 'confirmed',
      },
      {
        bookingReference: ref('HB', 4),
        userId: alice.id,
        hotelId: seaside.id,
        roomTypeId: standard.id,
        roomId: s101.id,
        checkIn: at(14),
        checkOut: at(16),
        guests: 1,
        totalAmount: '240.00',
        status: 'pending',
      },
      {
        bookingReference: ref('HB', 5),
        userId: bob.id,
        hotelId: grand.id,
        roomTypeId: suite.id,
        roomId: g301.id,
        checkIn: at(-30),
        checkOut: at(-28),
        guests: 2,
        totalAmount: '700.00',
        status: 'cancelled',
      },
      // Room-type-first bookings awaiting staff room assignment — feeds the
      // "unassigned upcoming" priority-action widget on the hotel dashboard.
      {
        bookingReference: ref('HB', 6),
        userId: carol.id,
        hotelId: grand.id,
        roomTypeId: deluxe.id,
        roomId: null,
        checkIn: at(2),
        checkOut: at(4),
        guests: 2,
        totalAmount: '400.00',
        status: 'confirmed',
      },
      {
        bookingReference: ref('HB', 7),
        userId: bob.id,
        hotelId: grand.id,
        roomTypeId: standard.id,
        roomId: null,
        checkIn: at(20),
        checkOut: at(22),
        guests: 1,
        totalAmount: '240.00',
        status: 'pending',
      },
    ])
    .returning()
    .all();
  const [hb1, hb2, hb3] = hotelBookingRows;

  // ── Ferry domain ─────────────────────────────────────────────────────────
  const route = db
    .insert(ferryRoutes)
    .values({
      name: 'Island ↔ Theme Park',
      origin: 'Main Island',
      destination: 'Theme Park Island',
    })
    .returning()
    .get();

  const [depOut, , futOut] = db
    .insert(ferrySchedules)
    .values([
      {
        routeId: route.id,
        departureAt: at(-9),
        direction: 'to_theme_park',
        capacity: 100,
        basePrice: '25.00',
        status: 'departed',
      },
      {
        routeId: route.id,
        departureAt: at(-9),
        direction: 'to_island',
        capacity: 100,
        basePrice: '25.00',
        status: 'departed',
      },
      {
        routeId: route.id,
        departureAt: at(6),
        direction: 'to_theme_park',
        capacity: 100,
        basePrice: '25.00',
        status: 'scheduled',
      },
      {
        routeId: route.id,
        departureAt: at(6),
        direction: 'to_island',
        capacity: 100,
        basePrice: '25.00',
        status: 'scheduled',
      },
    ])
    .returning()
    .all();

  const ferryBookingRows = db
    .insert(ferryBookings)
    .values([
      {
        bookingReference: ref('FB', 1),
        userId: alice.id,
        scheduleId: depOut.id,
        hotelBookingId: hb1.id,
        passengerCount: 2,
        totalAmount: '50.00',
        validatedBy: ferryStaff.id,
        validatedAt: at(-9),
        status: 'validated',
      },
      {
        bookingReference: ref('FB', 2),
        userId: carol.id,
        scheduleId: futOut.id,
        hotelBookingId: hb3.id,
        passengerCount: 3,
        totalAmount: '75.00',
        status: 'confirmed',
      },
      {
        bookingReference: ref('FB', 3),
        userId: bob.id,
        scheduleId: futOut.id,
        hotelBookingId: hb2.id,
        passengerCount: 2,
        totalAmount: '50.00',
        status: 'pending',
      },
    ])
    .returning()
    .all();

  // ── Theme park domain ────────────────────────────────────────────────────
  const [dayPass, vipPass] = db
    .insert(parkTicketTypes)
    .values([
      { name: 'Day Pass', price: '60.00' },
      { name: 'VIP Pass', price: '120.00' },
    ])
    .returning()
    .all();

  const parkTicketRows = db
    .insert(parkTickets)
    .values([
      {
        ticketReference: ref('PT', 1),
        userId: alice.id,
        ticketTypeId: dayPass.id,
        visitDate: at(-8),
        quantity: 2,
        totalAmount: '120.00',
        channel: 'online',
        status: 'used',
      },
      {
        ticketReference: ref('PT', 2),
        userId: bob.id,
        ticketTypeId: vipPass.id,
        visitDate: at(6),
        quantity: 1,
        totalAmount: '120.00',
        channel: 'online',
        status: 'active',
      },
      {
        ticketReference: ref('PT', 3),
        userId: carol.id,
        ticketTypeId: dayPass.id,
        visitDate: at(6),
        quantity: 3,
        totalAmount: '180.00',
        channel: 'online',
        status: 'active',
      },
      {
        ticketReference: ref('PT', 4),
        userId: bob.id,
        ticketTypeId: dayPass.id,
        visitDate: at(0),
        quantity: 2,
        totalAmount: '120.00',
        channel: 'gate',
        soldByUserId: parkStaff.id,
        status: 'active',
      },
      {
        ticketReference: ref('PT', 5),
        userId: alice.id,
        ticketTypeId: dayPass.id,
        visitDate: at(-20),
        quantity: 1,
        totalAmount: '60.00',
        channel: 'online',
        status: 'used',
      },
    ])
    .returning()
    .all();
  const [pt1, pt2, pt3] = parkTicketRows;

  const [coaster, dolphin, bonfire] = db
    .insert(events)
    .values([
      {
        name: 'Roller Coaster',
        description: 'The islands fastest ride.',
        eventType: 'ride',
        locationType: 'theme_park',
        basePrice: '15.00',
        isActive: true,
      },
      {
        name: 'Dolphin Show',
        description: 'Live dolphin performance.',
        eventType: 'show',
        locationType: 'theme_park',
        basePrice: '20.00',
        isActive: true,
      },
      {
        name: 'Beach Bonfire',
        description: 'Evening bonfire on Sunset Beach.',
        eventType: 'beach_event',
        locationType: 'beach',
        basePrice: '30.00',
        isActive: true,
      },
    ])
    .returning()
    .all();

  const [coasterPast, dolphinFut, bonfireFut] = db
    .insert(eventSchedules)
    .values([
      { eventId: coaster.id, startAt: at(-8), capacity: 50 },
      { eventId: dolphin.id, startAt: at(6), capacity: 200 },
      { eventId: bonfire.id, startAt: at(7), capacity: 80 },
      { eventId: coaster.id, startAt: at(6), capacity: 50 },
    ])
    .returning()
    .all();

  const eventBookingRows = db
    .insert(eventBookings)
    .values([
      {
        bookingReference: ref('EB', 1),
        userId: alice.id,
        eventScheduleId: coasterPast.id,
        parkTicketId: pt1.id,
        quantity: 2,
        totalAmount: '30.00',
        status: 'confirmed',
      },
      {
        bookingReference: ref('EB', 2),
        userId: carol.id,
        eventScheduleId: dolphinFut.id,
        parkTicketId: pt3.id,
        quantity: 3,
        totalAmount: '60.00',
        status: 'confirmed',
      },
      {
        bookingReference: ref('EB', 3),
        userId: bob.id,
        eventScheduleId: bonfireFut.id,
        parkTicketId: pt2.id,
        quantity: 1,
        totalAmount: '30.00',
        status: 'pending',
      },
    ])
    .returning()
    .all();

  // ── Payments (one per booking / ticket, polymorphic) ─────────────────────
  const payment = (
    userId: number,
    payableType: NewPayment['payableType'],
    payableId: number,
    amount: string,
    status: string,
    method: NewPayment['method'] = 'card',
  ): NewPayment => {
    const st = paymentStatusFor(status);
    return {
      userId,
      payableType,
      payableId,
      amount,
      status: st,
      method,
      paymentReference: randomUUID(),
      paidAt: st === 'completed' ? at(-1) : null,
    };
  };

  db.insert(payments)
    .values([
      ...hotelBookingRows.map((b) =>
        payment(b.userId, 'hotel_booking', b.id, b.totalAmount, b.status),
      ),
      ...ferryBookingRows.map((b) =>
        payment(b.userId, 'ferry_booking', b.id, b.totalAmount, b.status),
      ),
      ...parkTicketRows.map((t) =>
        payment(
          t.userId,
          'park_ticket',
          t.id,
          t.totalAmount,
          t.status,
          t.channel === 'gate' ? 'cash' : 'card',
        ),
      ),
      ...eventBookingRows.map((b) =>
        payment(b.userId, 'event_booking', b.id, b.totalAmount, b.status),
      ),
    ])
    .run();

  // ── Promotions ───────────────────────────────────────────────────────────
  const [summer, welcome] = db
    .insert(promotions)
    .values([
      {
        name: 'Summer Splash 10%',
        description: '10% off select stays and shows.',
        code: null,
        discountType: 'percentage',
        discountValue: '10.00',
        minSpend: '100.00',
        usageLimit: 100,
        perUserLimit: 2,
        validFrom: at(-30),
        validTo: at(30),
        isActive: true,
      },
      {
        name: 'Welcome £25',
        description: '£25 off your first ferry booking.',
        code: 'WELCOME25',
        discountType: 'fixed',
        discountValue: '25.00',
        minSpend: null,
        usageLimit: 500,
        perUserLimit: 1,
        validFrom: at(-60),
        validTo: at(60),
        isActive: true,
      },
    ])
    .returning()
    .all();

  db.insert(promotionTargets)
    .values([
      { promotionId: summer.id, targetType: 'room_type', targetId: deluxe.id },
      { promotionId: summer.id, targetType: 'event', targetId: dolphin.id },
      {
        promotionId: welcome.id,
        targetType: 'ferry_route',
        targetId: route.id,
      },
    ])
    .run();

  db.insert(promotionUsages)
    .values([
      {
        promotionId: summer.id,
        userId: bob.id,
        appliedToType: 'hotel_booking',
        appliedToId: hb2.id,
        discountAmount: '80.00',
      },
      {
        promotionId: welcome.id,
        userId: alice.id,
        appliedToType: 'ferry_booking',
        appliedToId: ferryBookingRows[0].id,
        discountAmount: '25.00',
      },
    ])
    .run();

  // ── Advertisements ───────────────────────────────────────────────────────
  db.insert(advertisements)
    .values([
      {
        title: 'Summer Splash Sale',
        image: 'https://picsum.photos/seed/summer/800/300',
        targetUrl: '/promotions',
        placement: 'homepage',
        startsAt: at(-10),
        endsAt: at(20),
        isActive: true,
      },
      {
        title: 'Go VIP at the Park',
        image: 'https://picsum.photos/seed/vip/400/600',
        targetUrl: '/park',
        placement: 'sidebar',
        startsAt: at(-5),
        endsAt: at(25),
        isActive: true,
      },
      {
        title: 'Sunset Beach Bonfire',
        image: 'https://picsum.photos/seed/bonfire/800/300',
        targetUrl: '/events',
        placement: 'map',
        startsAt: at(0),
        endsAt: at(14),
        isActive: true,
      },
    ])
    .run();

  // ── Polymorphic images ───────────────────────────────────────────────────
  const [roomImg, eventImg, grandImg, seasideImg] = db
    .insert(images)
    .values([
      { url: 'https://picsum.photos/seed/room101/600/400' },
      { url: 'https://picsum.photos/seed/coaster/600/400' },
      { url: '/images/hotels/hotel-grand-island.jpg' },
      { url: '/images/hotels/hotel-seaside-resort.jpg' },
    ])
    .returning()
    .all();
  db.insert(imageables)
    .values([
      { imageId: roomImg.id, imageableId: g101.id, imageableType: 'room' },
      { imageId: eventImg.id, imageableId: coaster.id, imageableType: 'event' },
      { imageId: grandImg.id, imageableId: grand.id, imageableType: 'hotel' },
      {
        imageId: seasideImg.id,
        imageableId: seaside.id,
        imageableType: 'hotel',
      },
    ])
    .run();

  // ── Staff assignments ────────────────────────────────────────────────────
  db.insert(userAssignments)
    .values([
      {
        userId: hotelStaff.id,
        assignableType: 'hotel',
        assignableId: grand.id,
      },
      {
        userId: ferryStaff.id,
        assignableType: 'ferry_route',
        assignableId: route.id,
      },
      {
        userId: parkStaff.id,
        assignableType: 'event',
        assignableId: coaster.id,
      },
    ])
    .run();

  // ── Audit trail (sample admin/system actions) ────────────────────────────
  db.insert(auditLogs)
    .values([
      {
        userId: admin.id,
        action: 'user.created',
        subjectType: 'User',
        subjectId: alice.id,
        metadata: { role: 'visitor' },
      },
      {
        userId: admin.id,
        action: 'promotion.created',
        subjectType: 'Promotion',
        subjectId: summer.id,
        metadata: { name: 'Summer Splash 10%' },
      },
      {
        userId: admin.id,
        action: 'advertisement.published',
        subjectType: 'Advertisement',
        subjectId: 1,
        metadata: { placement: 'homepage' },
      },
    ])
    .run();

  void beachLoc;
  console.log('✅ Seeded demo data across all domains');
}
