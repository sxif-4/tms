/**
 * Replace hotel / room_type image URLs with Unsplash set without a full reseed.
 */
import Database from 'better-sqlite3';

const path = process.env.DATABASE_PATH ?? './data/dev.db';
const db = new Database(path);

const byName: Record<string, string> = {
  'Velara Overwater Resort':
    'https://images.unsplash.com/photo-1578922746465-3a80a228f223?auto=format&fit=crop&w=1200&q=80',
  'Maafushi Beach Retreat':
    'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1200&q=80',
  'Coral Lagoon Lodge':
    'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1200&q=80',
  'Reef Cliff Suites':
    'https://images.unsplash.com/photo-1468413253725-0d5181091126?auto=format&fit=crop&w=1200&q=80',
  'Thulhagiri Palm Resort':
    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
  'Bandos Blue Lagoon':
    'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?auto=format&fit=crop&w=1200&q=80',
  'Kuramathi Sandbar Inn':
    'https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=1200&q=80',
  'Embudu Reef Hideaway':
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
  'Fulhadhoo Horizon Villas':
    'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1200&q=80',
};

const gallery = Object.values(byName);

const hotels = db
  .prepare(`SELECT id, name FROM hotels ORDER BY id`)
  .all() as { id: number; name: string }[];

const updateUrl = db.prepare(`UPDATE images SET url = ? WHERE id = ?`);
const insertImage = db.prepare(`INSERT INTO images (url) VALUES (?)`);
const insertImageable = db.prepare(
  `INSERT INTO imageables (image_id, imageable_id, imageable_type) VALUES (?, ?, ?)`,
);
const deleteRoomTypeLinks = db.prepare(
  `DELETE FROM imageables WHERE imageable_type = 'room_type'`,
);

const tx = db.transaction(() => {
  for (const hotel of hotels) {
    const primary = byName[hotel.name] ?? gallery[hotel.id % gallery.length];
    const extras = gallery.filter((u) => u !== primary).slice(0, 2);
    const urls = [primary, ...extras];

    const existing = db
      .prepare(
        `SELECT im.image_id AS imageId, i.url
         FROM imageables im JOIN images i ON i.id = im.image_id
         WHERE im.imageable_type = 'hotel' AND im.imageable_id = ?
         ORDER BY im.image_id`,
      )
      .all(hotel.id) as { imageId: number; url: string }[];

    for (let i = 0; i < urls.length; i++) {
      if (existing[i]) {
        updateUrl.run(urls[i], existing[i].imageId);
      } else {
        const info = insertImage.run(urls[i]);
        insertImageable.run(Number(info.lastInsertRowid), hotel.id, 'hotel');
      }
    }
  }

  // Rebuild room_type galleries: 3 Unsplash images each.
  deleteRoomTypeLinks.run();
  const roomTypes = db
    .prepare(`SELECT id FROM room_types ORDER BY id`)
    .all() as { id: number }[];
  roomTypes.forEach((rt, ri) => {
    for (let k = 0; k < 3; k++) {
      const url = gallery[(ri * 3 + k) % gallery.length];
      const info = insertImage.run(url);
      insertImageable.run(Number(info.lastInsertRowid), rt.id, 'room_type');
    }
  });
});

tx();

const hotelImgs = db
  .prepare(
    `SELECT COUNT(*) AS c FROM imageables WHERE imageable_type = 'hotel'`,
  )
  .get() as { c: number };
const rtImgs = db
  .prepare(
    `SELECT COUNT(*) AS c FROM imageables WHERE imageable_type = 'room_type'`,
  )
  .get() as { c: number };
const sample = db
  .prepare(
    `SELECT h.name, i.url FROM hotels h
     JOIN imageables im ON im.imageable_id = h.id AND im.imageable_type = 'hotel'
     JOIN images i ON i.id = im.image_id
     WHERE h.name = 'Velara Overwater Resort' LIMIT 1`,
  )
  .get() as { name: string; url: string };

console.log(
  `Patched Unsplash images. hotel links=${hotelImgs.c}, room_type links=${rtImgs.c}`,
);
console.log(`Sample: ${sample?.name} → ${sample?.url?.slice(0, 60)}…`);
db.close();
