/**
 * Maldives-flavoured demo seed across hotels, ferry, park, promos, and ads.
 *
 * Idempotent: skips if any hotel already exists.
 *
 * To re-apply after changing this file:
 *   cd apps/backend
 *   Remove-Item data/dev.db   # PowerShell — stop the backend first
 *   npm run db:migrate
 *   npm run db:seed
 */
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from '../schema';
import {
  advertisements,
  amenities,
  auditLogs,
  eventBookings,
  eventSchedules,
  events,
  facilities,
  hotelFacilities,
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
  roomTypeAmenities,
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
 * Seeds a rich, self-consistent set of Maldives-themed mock data across every
 * domain so reports/analytics have real numbers. Idempotent: bails if any
 * hotels already exist.
 */
export async function seedDemo(db: DemoDb): Promise<void> {
  if (db.select({ id: hotels.id }).from(hotels).get()) {
    console.log('ℹ️  Demo data already present — skipping demo seed');
    return;
  }

  // ── Visitor accounts ─────────────────────────────────────────────────────
  const visitorRole = db
    .select()
    .from(roles)
    .where(eq(roles.slug, 'visitor'))
    .get();
  if (!visitorRole) throw new Error('visitor role missing — run role seed');

  const password = process.env.STAFF_PASSWORD ?? 'ChangeMe123!';
  const passwordHash = await bcrypt.hash(password, 12);
  const [aisha, james, mei, hassan, sophie, priya] = db
    .insert(users)
    .values(
      [
        {
          name: 'Aisha Rahman',
          email: 'aisha@example.com',
          phone: '+960-771-0101',
        },
        {
          name: 'James Okonkwo',
          email: 'james@example.com',
          phone: '+960-771-0102',
        },
        {
          name: 'Mei Chen',
          email: 'mei@example.com',
          phone: '+960-771-0103',
        },
        {
          name: 'Hassan Ali',
          email: 'hassan@example.com',
          phone: '+960-771-0104',
        },
        {
          name: 'Sophie Laurent',
          email: 'sophie@example.com',
          phone: '+960-771-0105',
        },
        {
          name: 'Priya Nair',
          email: 'priya@example.com',
          phone: '+960-771-0106',
        },
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
  const locs = db
    .insert(mapLocations)
    .values([
      {
        name: 'Velara Overwater Resort',
        description: 'Flagship overwater villas on the central lagoon.',
        type: 'hotel',
        positionTop: '38.00',
        positionLeft: '52.00',
      },
      {
        name: 'Maafushi Beach Retreat',
        description: 'Local-island beachfront stay near the ferry jetty.',
        type: 'hotel',
        positionTop: '22.00',
        positionLeft: '38.00',
      },
      {
        name: 'Coral Lagoon Lodge',
        description: 'Quiet garden villas beside a turquoise lagoon.',
        type: 'hotel',
        positionTop: '48.00',
        positionLeft: '28.00',
      },
      {
        name: 'Reef Cliff Suites',
        description: 'Cliffside suites overlooking the outer reef.',
        type: 'hotel',
        positionTop: '62.00',
        positionLeft: '70.00',
      },
      {
        name: 'Thulhagiri Palm Resort',
        description: 'Palm-fringed resort with house reef access.',
        type: 'hotel',
        positionTop: '30.00',
        positionLeft: '22.00',
      },
      {
        name: 'Bandos Blue Lagoon',
        description: 'Family-friendly lagoon resort with dive centre.',
        type: 'hotel',
        positionTop: '18.00',
        positionLeft: '58.00',
      },
      {
        name: 'Kuramathi Sandbar Inn',
        description: 'Boutique inn facing a seasonal sandbar.',
        type: 'hotel',
        positionTop: '55.00',
        positionLeft: '42.00',
      },
      {
        name: 'Embudu Reef Hideaway',
        description: 'Intimate hideaway for divers and snorkellers.',
        type: 'hotel',
        positionTop: '70.00',
        positionLeft: '35.00',
      },
      {
        name: 'Fulhadhoo Horizon Villas',
        description: 'Horizon-edge villas on a quiet southern atoll tip.',
        type: 'hotel',
        positionTop: '78.00',
        positionLeft: '55.00',
      },
      {
        name: 'Hulhumalé Ferry Jetty',
        description: 'Speedboat departure point toward the resort islands.',
        type: 'ferry_terminal',
        positionTop: '36.00',
        positionLeft: '56.00',
      },
      {
        name: 'Resort Island Dock',
        description: 'Arrival dock for resort island transfers.',
        type: 'ferry_terminal',
        positionTop: '15.00',
        positionLeft: '85.00',
      },
      {
        name: 'Bikini Beach',
        description: 'Popular sandbank beach for swimming and picnics.',
        type: 'beach',
        positionTop: '16.00',
        positionLeft: '42.00',
      },
      {
        name: 'Sunset Sandbank',
        description: 'Evening BBQ and dolphin-spotting sandbank.',
        type: 'beach',
        positionTop: '44.00',
        positionLeft: '75.00',
      },
      {
        name: 'Coral Garden Snorkel Point',
        description: 'Shallow house-reef snorkel site with soft corals.',
        type: 'attraction',
        positionTop: '50.00',
        positionLeft: '30.00',
      },
      {
        name: 'Lagoon Café',
        description: 'Open-air café overlooking the jetty.',
        type: 'restaurant',
        positionTop: '40.00',
        positionLeft: '60.00',
      },
    ])
    .returning()
    .all();

  const [
    velaraLoc,
    maafushiLoc,
    coralLoc,
    reefLoc,
    thulhaLoc,
    bandosLoc,
    kuraLoc,
    embuduLoc,
    fulhaLoc,
  ] = locs;

  // ── Hotels (9) ───────────────────────────────────────────────────────────
  const hotelDefs = [
    {
      name: 'Velara Overwater Resort',
      description:
        'Five-star overwater villas above a turquoise lagoon — private decks, direct lagoon access, and sunset views across the atoll.',
      mapLocationId: velaraLoc.id,
      maxRooms: 40,
      image:
        'https://images.unsplash.com/photo-1578922746465-3a80a228f223?auto=format&fit=crop&w=1200&q=80',
    },
    {
      name: 'Maafushi Beach Retreat',
      description:
        'Relaxed beachfront rooms on a local island — sand between your toes, snorkel from the shore, minutes from the ferry jetty.',
      mapLocationId: maafushiLoc.id,
      maxRooms: 30,
      image:
        'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1200&q=80',
    },
    {
      name: 'Coral Lagoon Lodge',
      description:
        'Garden and lagoon villas tucked among tropical palms — quiet, breezy, and ideal for couples seeking a slower pace.',
      mapLocationId: coralLoc.id,
      maxRooms: 24,
      image:
        'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1200&q=80',
    },
    {
      name: 'Reef Cliff Suites',
      description:
        'Elevated suites perched above the outer reef — dramatic ocean views, reef drop-offs for snorkelling, and cliff-path walks.',
      mapLocationId: reefLoc.id,
      maxRooms: 20,
      image:
        'https://images.unsplash.com/photo-1468413253725-0d5181091126?auto=format&fit=crop&w=1200&q=80',
    },
    {
      name: 'Thulhagiri Palm Resort',
      description:
        'Palm-fringed house-reef resort — kayaks at dawn, reef fish by the jetty, and hammocks under coconut trees.',
      mapLocationId: thulhaLoc.id,
      maxRooms: 28,
      image:
        'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
    },
    {
      name: 'Bandos Blue Lagoon',
      description:
        'Family-friendly lagoon resort with a dive centre, kids’ pool, and wide sandy beach facing the channel.',
      mapLocationId: bandosLoc.id,
      maxRooms: 36,
      image:
        'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?auto=format&fit=crop&w=1200&q=80',
    },
    {
      name: 'Kuramathi Sandbar Inn',
      description:
        'Boutique inn facing a seasonal sandbar — walk-out beach at low tide and candlelit dinners under the stars.',
      mapLocationId: kuraLoc.id,
      maxRooms: 22,
      image:
        'https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=1200&q=80',
    },
    {
      name: 'Embudu Reef Hideaway',
      description:
        'Intimate dive-focused hideaway — steps from a vibrant house reef and night snorkels under bioluminescence.',
      mapLocationId: embuduLoc.id,
      maxRooms: 18,
      image:
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    },
    {
      name: 'Fulhadhoo Horizon Villas',
      description:
        'Horizon-edge villas on a quiet southern tip — endless ocean views and some of the clearest water in the atoll.',
      mapLocationId: fulhaLoc.id,
      maxRooms: 16,
      image:
        'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1200&q=80',
    },
  ] as const;

  const hotelRows = db
    .insert(hotels)
    .values(
      hotelDefs.map(({ name, description, mapLocationId, maxRooms }) => ({
        name,
        description,
        mapLocationId,
        maxRooms,
      })),
    )
    .returning()
    .all();

  const [velara, maafushi, coral, reef, thulha, bandos, kura, embudu, fulha] =
    hotelRows;

  // ── Facilities catalog (property-level, unlike room amenities) ───────────
  const facilityDefs = [
    { name: 'Rooftop Pool', icon: 'waves', category: 'recreation' as const },
    { name: 'Fitness Centre', icon: 'dumbbell', category: 'wellness' as const },
    { name: 'Spa & Sauna', icon: 'flower', category: 'wellness' as const },
    {
      name: 'In-House Restaurant',
      icon: 'utensils',
      category: 'dining' as const,
    },
    { name: 'Beach Bar', icon: 'wine', category: 'dining' as const },
    {
      name: '24/7 Room Service',
      icon: 'concierge-bell',
      category: 'services' as const,
    },
    { name: 'Airport Transfer', icon: 'plane', category: 'transport' as const },
    { name: 'Dive Centre', icon: 'fish', category: 'recreation' as const },
    { name: 'Kids Club', icon: 'baby', category: 'recreation' as const },
    { name: 'Laundry Service', icon: 'shirt', category: 'services' as const },
    { name: 'Free Parking', icon: 'car', category: 'transport' as const },
    { name: 'Yoga Pavilion', icon: 'flower', category: 'wellness' as const },
  ];

  const facilityRows = db
    .insert(facilities)
    .values(facilityDefs)
    .returning()
    .all();

  // Every hotel gets a rotating slice so the demo shows variation rather than
  // an identical list on every property.
  db.insert(hotelFacilities)
    .values(
      hotelRows.flatMap((hotel, hi) =>
        facilityRows
          .filter((_, fi) => (fi + hi) % 3 !== 0)
          .map((facility) => ({ hotelId: hotel.id, facilityId: facility.id })),
      ),
    )
    .run();

  // ── Room types (one set per hotel) ───────────────────────────────────────
  // Room types belong to a hotel, so every property gets its own copies. The
  // templates keep the demo data consistent; prices and descriptions are now
  // free to diverge per hotel, which is the point of the per-hotel model.
  const roomTypeTemplates = [
    {
      key: 'garden',
      name: 'Garden Villa',
      description:
        'Shaded garden villa with a king bed, rain shower, and private patio among the palms.',
      basePricePerNight: '180.00',
      maxOccupancy: 2,
      amenities: [
        'Wi‑Fi',
        'Air conditioning',
        'Rain shower',
        'Garden view',
        'Coffee machine',
        'Smart TV',
        'King bed',
      ],
    },
    {
      key: 'beach',
      name: 'Beach Villa',
      description:
        'Sand-level beach villa with ocean view, private deck, and snorkel gear ready by the door.',
      basePricePerNight: '280.00',
      maxOccupancy: 3,
      amenities: [
        'Wi‑Fi',
        'Air conditioning',
        'Rain shower',
        'Ocean view',
        'Coffee machine',
        'Smart TV',
        'King bed',
        'Private deck',
        'Mini bar',
        'Snorkel gear',
      ],
    },
    {
      key: 'overwater',
      name: 'Overwater Villa',
      description:
        'Classic overwater villa with glass floor panels, outdoor shower, and steps into the lagoon.',
      basePricePerNight: '450.00',
      maxOccupancy: 3,
      amenities: [
        'Wi‑Fi',
        'Air conditioning',
        'Rain shower',
        'Ocean view',
        'Lagoon view',
        'Coffee machine',
        'Smart TV',
        'King bed',
        'Private deck',
        'Mini bar',
        'Snorkel gear',
        'Direct lagoon access',
        'Outdoor shower',
        'Daybed',
      ],
    },
    {
      key: 'suite',
      name: 'Sunset Water Suite',
      description:
        'Spacious water suite with private pool, butler service, bathtub, and west-facing sunset deck.',
      basePricePerNight: '720.00',
      maxOccupancy: 4,
      amenities: [
        'Wi‑Fi',
        'Air conditioning',
        'Rain shower',
        'Ocean view',
        'Lagoon view',
        'Coffee machine',
        'Smart TV',
        'King bed',
        'Private deck',
        'Mini bar',
        'Snorkel gear',
        'Direct lagoon access',
        'Outdoor shower',
        'Daybed',
        'Private pool',
        'Butler service',
        'Bathtub',
        'Breakfast included',
      ],
    },
  ] as const;

  type RoomTypeKey = (typeof roomTypeTemplates)[number]['key'];

  const roomTypeRows = db
    .insert(roomTypes)
    .values(
      hotelRows.flatMap((hotel) =>
        roomTypeTemplates.map((t) => ({
          hotelId: hotel.id,
          name: t.name,
          description: t.description,
          basePricePerNight: t.basePricePerNight,
          maxOccupancy: t.maxOccupancy,
        })),
      ),
    )
    .returning()
    .all();

  // `${hotelId}:${key}` → the room type row for that hotel.
  const roomTypeIndex = new Map<string, (typeof roomTypeRows)[number]>();
  roomTypeRows.forEach((row, i) => {
    const key = roomTypeTemplates[i % roomTypeTemplates.length].key;
    roomTypeIndex.set(`${row.hotelId}:${key}`, row);
  });

  /** The given hotel's copy of a room type. */
  const rt = (hotelId: number, key: RoomTypeKey) => {
    const row = roomTypeIndex.get(`${hotelId}:${key}`);
    if (!row) throw new Error(`room type ${key} missing for hotel ${hotelId}`);
    return row;
  };

  // ── Amenities catalog ────────────────────────────────────────────────────
  const amenityDefs = [
    { name: 'Wi‑Fi', icon: 'wifi', category: 'tech' as const },
    { name: 'Air conditioning', icon: 'wind', category: 'comfort' as const },
    { name: 'Mini bar', icon: 'wine', category: 'dining' as const },
    { name: 'Private pool', icon: 'waves', category: 'outdoor' as const },
    {
      name: 'Outdoor shower',
      icon: 'shower-head',
      category: 'bathroom' as const,
    },
    { name: 'Ocean view', icon: 'eye', category: 'view' as const },
    { name: 'Lagoon view', icon: 'eye', category: 'view' as const },
    { name: 'Garden view', icon: 'tree-palm', category: 'view' as const },
    { name: 'King bed', icon: 'bed-double', category: 'comfort' as const },
    { name: 'Daybed', icon: 'sofa', category: 'outdoor' as const },
    {
      name: 'Butler service',
      icon: 'concierge-bell',
      category: 'comfort' as const,
    },
    { name: 'Snorkel gear', icon: 'fish', category: 'outdoor' as const },
    { name: 'Rain shower', icon: 'shower-head', category: 'bathroom' as const },
    { name: 'Bathtub', icon: 'bath', category: 'bathroom' as const },
    { name: 'Coffee machine', icon: 'coffee', category: 'dining' as const },
    { name: 'Smart TV', icon: 'tv', category: 'tech' as const },
    { name: 'Private deck', icon: 'home', category: 'outdoor' as const },
    {
      name: 'Direct lagoon access',
      icon: 'anchor',
      category: 'outdoor' as const,
    },
    {
      name: 'Breakfast included',
      icon: 'utensils',
      category: 'dining' as const,
    },
  ];

  const amenityRows = db
    .insert(amenities)
    .values(amenityDefs)
    .returning()
    .all();
  const amenityByName = new Map(amenityRows.map((a) => [a.name, a]));

  const amenityIdFor = (name: string): number => {
    const amenity = amenityByName.get(name);
    if (!amenity) throw new Error(`amenity missing: ${name}`);
    return amenity.id;
  };

  // Each hotel's copy of a template gets that template's amenity list.
  db.insert(roomTypeAmenities)
    .values(
      roomTypeRows.flatMap((row, i) => {
        const names: readonly string[] =
          roomTypeTemplates[i % roomTypeTemplates.length].amenities;
        return names.map((name) => ({
          roomTypeId: row.id,
          amenityId: amenityIdFor(name),
        }));
      }),
    )
    .run();

  // ── Rooms (~3–4 per hotel) ───────────────────────────────────────────────
  type RoomStatus = 'available' | 'occupied' | 'maintenance' | 'out_of_service';

  const roomSpecs: {
    hotelId: number;
    roomTypeKey: RoomTypeKey;
    roomNumber: string;
    status: RoomStatus;
  }[] = [
    // Velara — flagship (keep free rooms for assign-room)
    {
      hotelId: velara.id,
      roomTypeKey: 'garden' as const,
      roomNumber: 'V-101',
      status: 'available',
    },
    {
      hotelId: velara.id,
      roomTypeKey: 'garden' as const,
      roomNumber: 'V-102',
      status: 'available',
    },
    {
      hotelId: velara.id,
      roomTypeKey: 'beach' as const,
      roomNumber: 'V-201',
      status: 'occupied',
    },
    {
      hotelId: velara.id,
      roomTypeKey: 'overwater' as const,
      roomNumber: 'V-301',
      status: 'available',
    },
    {
      hotelId: velara.id,
      roomTypeKey: 'suite' as const,
      roomNumber: 'V-401',
      status: 'available',
    },
    // Maafushi
    {
      hotelId: maafushi.id,
      roomTypeKey: 'garden' as const,
      roomNumber: 'M-101',
      status: 'available',
    },
    {
      hotelId: maafushi.id,
      roomTypeKey: 'beach' as const,
      roomNumber: 'M-201',
      status: 'available',
    },
    {
      hotelId: maafushi.id,
      roomTypeKey: 'beach' as const,
      roomNumber: 'M-202',
      status: 'maintenance',
    },
    {
      hotelId: maafushi.id,
      roomTypeKey: 'overwater' as const,
      roomNumber: 'M-301',
      status: 'available',
    },
    // Coral
    {
      hotelId: coral.id,
      roomTypeKey: 'garden' as const,
      roomNumber: 'C-101',
      status: 'available',
    },
    {
      hotelId: coral.id,
      roomTypeKey: 'garden' as const,
      roomNumber: 'C-102',
      status: 'occupied',
    },
    {
      hotelId: coral.id,
      roomTypeKey: 'beach' as const,
      roomNumber: 'C-201',
      status: 'available',
    },
    {
      hotelId: coral.id,
      roomTypeKey: 'overwater' as const,
      roomNumber: 'C-301',
      status: 'available',
    },
    // Reef
    {
      hotelId: reef.id,
      roomTypeKey: 'beach' as const,
      roomNumber: 'R-101',
      status: 'available',
    },
    {
      hotelId: reef.id,
      roomTypeKey: 'overwater' as const,
      roomNumber: 'R-201',
      status: 'available',
    },
    {
      hotelId: reef.id,
      roomTypeKey: 'suite' as const,
      roomNumber: 'R-301',
      status: 'occupied',
    },
    // Thulhagiri
    {
      hotelId: thulha.id,
      roomTypeKey: 'garden' as const,
      roomNumber: 'T-101',
      status: 'available',
    },
    {
      hotelId: thulha.id,
      roomTypeKey: 'beach' as const,
      roomNumber: 'T-201',
      status: 'available',
    },
    {
      hotelId: thulha.id,
      roomTypeKey: 'overwater' as const,
      roomNumber: 'T-301',
      status: 'maintenance',
    },
    {
      hotelId: thulha.id,
      roomTypeKey: 'suite' as const,
      roomNumber: 'T-401',
      status: 'available',
    },
    // Bandos
    {
      hotelId: bandos.id,
      roomTypeKey: 'garden' as const,
      roomNumber: 'B-101',
      status: 'available',
    },
    {
      hotelId: bandos.id,
      roomTypeKey: 'beach' as const,
      roomNumber: 'B-201',
      status: 'occupied',
    },
    {
      hotelId: bandos.id,
      roomTypeKey: 'beach' as const,
      roomNumber: 'B-202',
      status: 'available',
    },
    {
      hotelId: bandos.id,
      roomTypeKey: 'overwater' as const,
      roomNumber: 'B-301',
      status: 'available',
    },
    // Kuramathi
    {
      hotelId: kura.id,
      roomTypeKey: 'garden' as const,
      roomNumber: 'K-101',
      status: 'available',
    },
    {
      hotelId: kura.id,
      roomTypeKey: 'beach' as const,
      roomNumber: 'K-201',
      status: 'available',
    },
    {
      hotelId: kura.id,
      roomTypeKey: 'overwater' as const,
      roomNumber: 'K-301',
      status: 'available',
    },
    // Embudu
    {
      hotelId: embudu.id,
      roomTypeKey: 'garden' as const,
      roomNumber: 'E-101',
      status: 'available',
    },
    {
      hotelId: embudu.id,
      roomTypeKey: 'beach' as const,
      roomNumber: 'E-201',
      status: 'occupied',
    },
    {
      hotelId: embudu.id,
      roomTypeKey: 'overwater' as const,
      roomNumber: 'E-301',
      status: 'available',
    },
    // Fulhadhoo
    {
      hotelId: fulha.id,
      roomTypeKey: 'beach' as const,
      roomNumber: 'F-101',
      status: 'available',
    },
    {
      hotelId: fulha.id,
      roomTypeKey: 'overwater' as const,
      roomNumber: 'F-201',
      status: 'available',
    },
    {
      hotelId: fulha.id,
      roomTypeKey: 'suite' as const,
      roomNumber: 'F-301',
      status: 'available',
    },
  ];

  const roomRows = db
    .insert(rooms)
    .values(
      roomSpecs.map(({ hotelId, roomTypeKey, roomNumber, status }) => ({
        hotelId,
        roomTypeId: rt(hotelId, roomTypeKey).id,
        roomNumber,
        status,
      })),
    )
    .returning()
    .all();
  const roomByNumber = Object.fromEntries(
    roomRows.map((r) => [r.roomNumber, r]),
  );

  // ── Hotel bookings ───────────────────────────────────────────────────────
  const bookingSpecs: {
    bookingReference: string;
    userId: number;
    hotelId: number;
    roomTypeKey: RoomTypeKey;
    /** null for bookings not yet allocated a physical room. */
    roomId?: number | null;
    checkIn: Date;
    checkOut: Date;
    guests: number;
    totalAmount: string;
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  }[] = [
    {
      bookingReference: ref('HB', 1),
      userId: aisha.id,
      hotelId: velara.id,
      roomTypeKey: 'garden' as const,
      roomId: roomByNumber['V-101'].id,
      checkIn: at(-10),
      checkOut: at(-7),
      guests: 2,
      totalAmount: '540.00',
      status: 'completed',
    },
    {
      bookingReference: ref('HB', 2),
      userId: james.id,
      hotelId: velara.id,
      roomTypeKey: 'beach' as const,
      roomId: roomByNumber['V-201'].id,
      checkIn: at(-3),
      checkOut: at(1),
      guests: 2,
      totalAmount: '1120.00',
      status: 'confirmed',
    },
    {
      bookingReference: ref('HB', 3),
      userId: mei.id,
      hotelId: maafushi.id,
      roomTypeKey: 'overwater' as const,
      roomId: roomByNumber['M-301'].id,
      checkIn: at(5),
      checkOut: at(9),
      guests: 3,
      totalAmount: '1800.00',
      status: 'confirmed',
    },
    {
      bookingReference: ref('HB', 4),
      userId: aisha.id,
      hotelId: maafushi.id,
      roomTypeKey: 'beach' as const,
      roomId: roomByNumber['M-201'].id,
      checkIn: at(14),
      checkOut: at(16),
      guests: 1,
      totalAmount: '560.00',
      status: 'pending',
    },
    {
      bookingReference: ref('HB', 5),
      userId: james.id,
      hotelId: velara.id,
      roomTypeKey: 'suite' as const,
      roomId: roomByNumber['V-401'].id,
      checkIn: at(-30),
      checkOut: at(-28),
      guests: 2,
      totalAmount: '1440.00',
      status: 'cancelled',
    },
    // Unassigned — Velara priority-action widget
    {
      bookingReference: ref('HB', 6),
      userId: hassan.id,
      hotelId: velara.id,
      roomTypeKey: 'overwater' as const,
      roomId: null,
      checkIn: at(2),
      checkOut: at(4),
      guests: 2,
      totalAmount: '900.00',
      status: 'confirmed',
    },
    {
      bookingReference: ref('HB', 7),
      userId: sophie.id,
      hotelId: velara.id,
      roomTypeKey: 'garden' as const,
      roomId: null,
      checkIn: at(20),
      checkOut: at(22),
      guests: 1,
      totalAmount: '360.00',
      status: 'pending',
    },
    {
      bookingReference: ref('HB', 8),
      userId: priya.id,
      hotelId: velara.id,
      roomTypeKey: 'beach' as const,
      roomId: null,
      checkIn: at(8),
      checkOut: at(11),
      guests: 2,
      totalAmount: '840.00',
      status: 'confirmed',
    },
    {
      bookingReference: ref('HB', 9),
      userId: mei.id,
      hotelId: coral.id,
      roomTypeKey: 'garden' as const,
      roomId: roomByNumber['C-101'].id,
      checkIn: at(-5),
      checkOut: at(-2),
      guests: 2,
      totalAmount: '540.00',
      status: 'completed',
    },
    {
      bookingReference: ref('HB', 10),
      userId: hassan.id,
      hotelId: bandos.id,
      roomTypeKey: 'beach' as const,
      roomId: roomByNumber['B-202'].id,
      checkIn: at(3),
      checkOut: at(7),
      guests: 3,
      totalAmount: '1120.00',
      status: 'confirmed',
    },
    {
      bookingReference: ref('HB', 11),
      userId: sophie.id,
      hotelId: reef.id,
      roomTypeKey: 'overwater' as const,
      roomId: roomByNumber['R-201'].id,
      checkIn: at(12),
      checkOut: at(15),
      guests: 2,
      totalAmount: '1350.00',
      status: 'pending',
    },
    {
      bookingReference: ref('HB', 12),
      userId: priya.id,
      hotelId: thulha.id,
      roomTypeKey: 'suite' as const,
      roomId: roomByNumber['T-401'].id,
      checkIn: at(-15),
      checkOut: at(-12),
      guests: 4,
      totalAmount: '2160.00',
      status: 'completed',
    },
    {
      bookingReference: ref('HB', 13),
      userId: james.id,
      hotelId: kura.id,
      roomTypeKey: 'beach' as const,
      roomId: roomByNumber['K-201'].id,
      checkIn: at(6),
      checkOut: at(8),
      guests: 2,
      totalAmount: '560.00',
      status: 'confirmed',
    },
    {
      bookingReference: ref('HB', 14),
      userId: aisha.id,
      hotelId: embudu.id,
      roomTypeKey: 'overwater' as const,
      roomId: roomByNumber['E-301'].id,
      checkIn: at(18),
      checkOut: at(21),
      guests: 2,
      totalAmount: '1350.00',
      status: 'pending',
    },
    {
      bookingReference: ref('HB', 15),
      userId: mei.id,
      hotelId: fulha.id,
      roomTypeKey: 'suite' as const,
      roomId: roomByNumber['F-301'].id,
      checkIn: at(-20),
      checkOut: at(-17),
      guests: 3,
      totalAmount: '2160.00',
      status: 'cancelled',
    },
    {
      bookingReference: ref('HB', 16),
      userId: hassan.id,
      hotelId: bandos.id,
      roomTypeKey: 'garden' as const,
      roomId: roomByNumber['B-101'].id,
      checkIn: at(1),
      checkOut: at(3),
      guests: 2,
      totalAmount: '360.00',
      status: 'confirmed',
    },
  ];

  const hotelBookingRows = db
    .insert(hotelBookings)
    .values(
      bookingSpecs.map(({ roomTypeKey, ...booking }) => ({
        ...booking,
        roomTypeId: rt(booking.hotelId, roomTypeKey).id,
      })),
    )
    .returning()
    .all();
  const [hb1, hb2, hb3] = hotelBookingRows;

  // ── Ferry domain ─────────────────────────────────────────────────────────
  const route = db
    .insert(ferryRoutes)
    .values({
      name: 'Hulhumalé ↔ Resort Island',
      origin: 'Hulhumalé Jetty',
      destination: 'Resort Island Dock',
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
        capacity: 80,
        basePrice: '40.00',
        status: 'departed',
      },
      {
        routeId: route.id,
        departureAt: at(-9),
        direction: 'to_island',
        capacity: 80,
        basePrice: '40.00',
        status: 'departed',
      },
      {
        routeId: route.id,
        departureAt: at(6),
        direction: 'to_theme_park',
        capacity: 80,
        basePrice: '40.00',
        status: 'scheduled',
      },
      {
        routeId: route.id,
        departureAt: at(6),
        direction: 'to_island',
        capacity: 80,
        basePrice: '40.00',
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
        userId: aisha.id,
        scheduleId: depOut.id,
        hotelBookingId: hb1.id,
        passengerCount: 2,
        totalAmount: '80.00',
        validatedBy: ferryStaff.id,
        validatedAt: at(-9),
        status: 'validated',
      },
      {
        bookingReference: ref('FB', 2),
        userId: mei.id,
        scheduleId: futOut.id,
        hotelBookingId: hb3.id,
        passengerCount: 3,
        totalAmount: '120.00',
        status: 'confirmed',
      },
      {
        bookingReference: ref('FB', 3),
        userId: james.id,
        scheduleId: futOut.id,
        hotelBookingId: hb2.id,
        passengerCount: 2,
        totalAmount: '80.00',
        status: 'pending',
      },
    ])
    .returning()
    .all();

  // ── Theme park / island activities ───────────────────────────────────────
  const [dayPass, vipPass] = db
    .insert(parkTicketTypes)
    .values([
      { name: 'Island Day Pass', price: '75.00' },
      { name: 'Lagoon VIP Pass', price: '140.00' },
    ])
    .returning()
    .all();

  const parkTicketRows = db
    .insert(parkTickets)
    .values([
      {
        ticketReference: ref('PT', 1),
        userId: aisha.id,
        ticketTypeId: dayPass.id,
        visitDate: at(-8),
        quantity: 2,
        totalAmount: '150.00',
        channel: 'online',
        status: 'used',
      },
      {
        ticketReference: ref('PT', 2),
        userId: james.id,
        ticketTypeId: vipPass.id,
        visitDate: at(6),
        quantity: 1,
        totalAmount: '140.00',
        channel: 'online',
        status: 'active',
      },
      {
        ticketReference: ref('PT', 3),
        userId: mei.id,
        ticketTypeId: dayPass.id,
        visitDate: at(6),
        quantity: 3,
        totalAmount: '225.00',
        channel: 'online',
        status: 'active',
      },
      {
        ticketReference: ref('PT', 4),
        userId: hassan.id,
        ticketTypeId: dayPass.id,
        visitDate: at(0),
        quantity: 2,
        totalAmount: '150.00',
        channel: 'gate',
        soldByUserId: parkStaff.id,
        status: 'active',
      },
      {
        ticketReference: ref('PT', 5),
        userId: sophie.id,
        ticketTypeId: dayPass.id,
        visitDate: at(-20),
        quantity: 1,
        totalAmount: '75.00',
        channel: 'online',
        status: 'used',
      },
    ])
    .returning()
    .all();
  const [pt1, pt2, pt3] = parkTicketRows;

  const [snorkel, dolphin, sandbankBbq] = db
    .insert(events)
    .values([
      {
        name: 'Snorkel Safari',
        description: 'Guided house-reef snorkel with marine biologist.',
        eventType: 'ride',
        locationType: 'theme_park',
        basePrice: '35.00',
        isActive: true,
      },
      {
        name: 'Dolphin Cruise',
        description: 'Sunset speedboat cruise to spot spinner dolphins.',
        eventType: 'show',
        locationType: 'theme_park',
        basePrice: '55.00',
        isActive: true,
      },
      {
        name: 'Sunset Sandbank BBQ',
        description: 'Private sandbank dinner under the stars.',
        eventType: 'beach_event',
        locationType: 'beach',
        basePrice: '90.00',
        isActive: true,
      },
    ])
    .returning()
    .all();

  const [snorkelPast, dolphinFut, bbqFut] = db
    .insert(eventSchedules)
    .values([
      { eventId: snorkel.id, startAt: at(-8), capacity: 40 },
      { eventId: dolphin.id, startAt: at(6), capacity: 60 },
      { eventId: sandbankBbq.id, startAt: at(7), capacity: 30 },
      { eventId: snorkel.id, startAt: at(6), capacity: 40 },
    ])
    .returning()
    .all();

  const eventBookingRows = db
    .insert(eventBookings)
    .values([
      {
        bookingReference: ref('EB', 1),
        userId: aisha.id,
        eventScheduleId: snorkelPast.id,
        parkTicketId: pt1.id,
        quantity: 2,
        totalAmount: '70.00',
        status: 'confirmed',
      },
      {
        bookingReference: ref('EB', 2),
        userId: mei.id,
        eventScheduleId: dolphinFut.id,
        parkTicketId: pt3.id,
        quantity: 3,
        totalAmount: '165.00',
        status: 'confirmed',
      },
      {
        bookingReference: ref('EB', 3),
        userId: james.id,
        eventScheduleId: bbqFut.id,
        parkTicketId: pt2.id,
        quantity: 1,
        totalAmount: '90.00',
        status: 'pending',
      },
    ])
    .returning()
    .all();

  // ── Payments ─────────────────────────────────────────────────────────────
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
  const [monsoon, welcome] = db
    .insert(promotions)
    .values([
      {
        name: 'Monsoon Escape 15%',
        description: '15% off Beach Villas and Dolphin Cruise bookings.',
        code: null,
        discountType: 'percentage',
        discountValue: '15.00',
        minSpend: '200.00',
        usageLimit: 100,
        perUserLimit: 2,
        validFrom: at(-30),
        validTo: at(30),
        isActive: true,
      },
      {
        name: 'Welcome £50 Ferry',
        description: '£50 off your first Hulhumalé speedboat transfer.',
        code: 'WELCOME50',
        discountType: 'fixed',
        discountValue: '50.00',
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
      // Scoped to Velara's own Beach Villa — the hotel its owner is assigned to.
      {
        promotionId: monsoon.id,
        targetType: 'room_type',
        targetId: rt(velara.id, 'beach').id,
      },
      { promotionId: monsoon.id, targetType: 'event', targetId: dolphin.id },
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
        promotionId: monsoon.id,
        userId: james.id,
        appliedToType: 'hotel_booking',
        appliedToId: hb2.id,
        discountAmount: '168.00',
      },
      {
        promotionId: welcome.id,
        userId: aisha.id,
        appliedToType: 'ferry_booking',
        appliedToId: ferryBookingRows[0].id,
        discountAmount: '50.00',
      },
    ])
    .run();

  // ── Advertisements ───────────────────────────────────────────────────────
  db.insert(advertisements)
    .values([
      {
        title: 'Monsoon Escape — 15% off Beach Villas',
        image: '/images/hero/hero-island.jpg',
        targetUrl: '/hotels',
        placement: 'homepage',
        startsAt: at(-10),
        endsAt: at(20),
        isActive: true,
      },
      {
        title: 'Lagoon VIP Pass',
        image: '/images/hotels/hotel-seaside-resort.jpg',
        targetUrl: '/theme-park',
        placement: 'sidebar',
        startsAt: at(-5),
        endsAt: at(25),
        isActive: true,
      },
      {
        title: 'Sunset Sandbank BBQ',
        image: '/images/hero/hero-island-resort.jpg',
        targetUrl: '/map',
        placement: 'map',
        startsAt: at(0),
        endsAt: at(14),
        isActive: true,
      },
    ])
    .run();

  // ── Polymorphic images (3 per hotel + 3 per room type) ───────────────────
  const galleryUrls = hotelDefs.map((h) => h.image);

  const hotelImageRows: { url: string }[] = [];
  const hotelImageableRows: {
    imageIndex: number;
    imageableId: number;
  }[] = [];
  for (let hi = 0; hi < hotelRows.length; hi++) {
    const primary = hotelDefs[hi].image;
    const extras = galleryUrls.filter((u) => u !== primary).slice(0, 2);
    const urls = [primary, ...extras];
    for (const url of urls) {
      hotelImageableRows.push({
        imageIndex: hotelImageRows.length,
        imageableId: hotelRows[hi].id,
      });
      hotelImageRows.push({ url });
    }
  }

  // Every hotel's copy of a template shares that template's gallery, so each
  // hotel's detail page has room-type photos.
  const roomTypeImageUrls: { roomTypeId: number; url: string }[] = [];
  roomTypeRows.forEach((row, i) => {
    const templateIndex = i % roomTypeTemplates.length;
    for (let k = 0; k < 3; k++) {
      roomTypeImageUrls.push({
        roomTypeId: row.id,
        url: galleryUrls[(templateIndex * 3 + k) % galleryUrls.length],
      });
    }
  });

  const allImageInserts = [
    ...hotelImageRows,
    ...roomTypeImageUrls.map((r) => ({ url: r.url })),
    {
      url: 'https://images.unsplash.com/photo-1468413253725-0d5181091126?auto=format&fit=crop&w=1200&q=80',
    },
  ];
  const insertedImages = db
    .insert(images)
    .values(allImageInserts)
    .returning()
    .all();

  const hotelImageCount = hotelImageRows.length;
  const roomTypeImageStart = hotelImageCount;
  const snorkelImg = insertedImages[insertedImages.length - 1];

  /**
   * Marks the first image of each owner as its cover and numbers the rest, so
   * seeded galleries behave exactly like uploaded ones.
   */
  const seenOwners = new Set<string>();
  const withCover = <T extends { imageableId: number; imageableType: string }>(
    row: T,
  ) => {
    const key = `${row.imageableType}:${row.imageableId}`;
    const isFirst = !seenOwners.has(key);
    seenOwners.add(key);
    return { ...row, isCover: isFirst, sortOrder: 0 };
  };

  db.insert(imageables)
    .values(
      [
        ...hotelImageableRows.map((r) => ({
          imageId: insertedImages[r.imageIndex].id,
          imageableId: r.imageableId,
          imageableType: 'hotel',
        })),
        ...roomTypeImageUrls.map((r, i) => ({
          imageId: insertedImages[roomTypeImageStart + i].id,
          imageableId: r.roomTypeId,
          imageableType: 'room_type',
        })),
        {
          imageId: snorkelImg.id,
          imageableId: snorkel.id,
          imageableType: 'event',
        },
      ].map(withCover),
    )
    .run();

  // ── Staff assignments ────────────────────────────────────────────────────
  db.insert(userAssignments)
    .values([
      {
        userId: hotelStaff.id,
        assignableType: 'hotel',
        assignableId: velara.id,
      },
      {
        userId: ferryStaff.id,
        assignableType: 'ferry_route',
        assignableId: route.id,
      },
      {
        userId: parkStaff.id,
        assignableType: 'event',
        assignableId: snorkel.id,
      },
    ])
    .run();

  // ── Audit trail ──────────────────────────────────────────────────────────
  db.insert(auditLogs)
    .values([
      {
        userId: admin.id,
        action: 'user.created',
        subjectType: 'User',
        subjectId: aisha.id,
        metadata: { role: 'visitor' },
      },
      {
        userId: admin.id,
        action: 'promotion.created',
        subjectType: 'Promotion',
        subjectId: monsoon.id,
        metadata: { name: 'Monsoon Escape 15%' },
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

  console.log(
    `✅ Seeded Maldives demo: ${hotelRows.length} hotels, ${roomRows.length} rooms, ${amenityRows.length} amenities`,
  );
}
