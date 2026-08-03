import { Inject, Injectable } from '@nestjs/common';
import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDB } from '../database/drizzle.constants';
import { imageables, images } from '../database/schema';

export interface OwnedImage {
  id: number;
  url: string;
  isCover: boolean;
  sortOrder: number;
}

/**
 * Sole owner of Drizzle queries for `images` and the polymorphic `imageables`
 * join. Callers pass the owner type (`room_type`, `hotel`, …) explicitly.
 */
@Injectable()
export class ImagesRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  /** Cover first, then gallery order, then id — the canonical display order. */
  findForOwner(ownerType: string, ownerId: number): Promise<OwnedImage[]> {
    const rows = this.db
      .select({
        id: images.id,
        url: images.url,
        isCover: imageables.isCover,
        sortOrder: imageables.sortOrder,
      })
      .from(imageables)
      .innerJoin(images, eq(images.id, imageables.imageId))
      .where(
        and(
          eq(imageables.imageableType, ownerType),
          eq(imageables.imageableId, ownerId),
        ),
      )
      .orderBy(
        desc(imageables.isCover),
        asc(imageables.sortOrder),
        asc(images.id),
      )
      .all();
    return Promise.resolve(rows);
  }

  /**
   * Batched `findForOwner`, keyed by owner id — avoids one query per row when
   * a list view needs every owner's images at once.
   */
  findForOwners(
    ownerType: string,
    ownerIds: number[],
  ): Map<number, OwnedImage[]> {
    const map = new Map<number, OwnedImage[]>();
    if (ownerIds.length === 0) return map;

    const rows = this.db
      .select({
        ownerId: imageables.imageableId,
        id: images.id,
        url: images.url,
        isCover: imageables.isCover,
        sortOrder: imageables.sortOrder,
      })
      .from(imageables)
      .innerJoin(images, eq(images.id, imageables.imageId))
      .where(
        and(
          eq(imageables.imageableType, ownerType),
          inArray(imageables.imageableId, ownerIds),
        ),
      )
      .orderBy(
        desc(imageables.isCover),
        asc(imageables.sortOrder),
        asc(images.id),
      )
      .all();

    for (const { ownerId, ...image } of rows) {
      const list = map.get(ownerId) ?? [];
      list.push(image);
      map.set(ownerId, list);
    }
    return map;
  }

  /** Adds an image and links it, becoming the cover when it's the first one. */
  attach(ownerType: string, ownerId: number, url: string): Promise<OwnedImage> {
    return Promise.resolve(
      this.db.transaction((tx) => {
        const image = tx.insert(images).values({ url }).returning().get();

        const existing = tx
          .select({ count: sql<number>`COUNT(*)` })
          .from(imageables)
          .where(
            and(
              eq(imageables.imageableType, ownerType),
              eq(imageables.imageableId, ownerId),
            ),
          )
          .get();
        const isFirst = (existing?.count ?? 0) === 0;

        tx.insert(imageables)
          .values({
            imageId: image.id,
            imageableId: ownerId,
            imageableType: ownerType,
            isCover: isFirst,
            sortOrder: existing?.count ?? 0,
          })
          .run();

        return {
          id: image.id,
          url: image.url,
          isCover: isFirst,
          sortOrder: existing?.count ?? 0,
        };
      }),
    );
  }

  findLink(
    ownerType: string,
    ownerId: number,
    imageId: number,
  ): Promise<OwnedImage | undefined> {
    const row = this.db
      .select({
        id: images.id,
        url: images.url,
        isCover: imageables.isCover,
        sortOrder: imageables.sortOrder,
      })
      .from(imageables)
      .innerJoin(images, eq(images.id, imageables.imageId))
      .where(
        and(
          eq(imageables.imageableType, ownerType),
          eq(imageables.imageableId, ownerId),
          eq(imageables.imageId, imageId),
        ),
      )
      .get();
    return Promise.resolve(row);
  }

  /**
   * Detaches and deletes the image row. If it was the cover, the next image in
   * order is promoted so an owner is never left cover-less.
   */
  detach(ownerType: string, ownerId: number, imageId: number): Promise<void> {
    this.db.transaction((tx) => {
      tx.delete(imageables)
        .where(
          and(
            eq(imageables.imageableType, ownerType),
            eq(imageables.imageableId, ownerId),
            eq(imageables.imageId, imageId),
          ),
        )
        .run();
      // images rows are not shared between owners, so the image goes too.
      tx.delete(images).where(eq(images.id, imageId)).run();

      const remaining = tx
        .select({ imageId: imageables.imageId, isCover: imageables.isCover })
        .from(imageables)
        .where(
          and(
            eq(imageables.imageableType, ownerType),
            eq(imageables.imageableId, ownerId),
          ),
        )
        .orderBy(asc(imageables.sortOrder), asc(imageables.imageId))
        .all();

      if (remaining.length > 0 && !remaining.some((r) => r.isCover)) {
        tx.update(imageables)
          .set({ isCover: true })
          .where(
            and(
              eq(imageables.imageableType, ownerType),
              eq(imageables.imageableId, ownerId),
              eq(imageables.imageId, remaining[0].imageId),
            ),
          )
          .run();
      }
    });
    return Promise.resolve();
  }

  /** Makes one image the cover, clearing the flag from the rest. */
  setCover(ownerType: string, ownerId: number, imageId: number): Promise<void> {
    this.db.transaction((tx) => {
      const owner = and(
        eq(imageables.imageableType, ownerType),
        eq(imageables.imageableId, ownerId),
      );
      tx.update(imageables).set({ isCover: false }).where(owner).run();
      tx.update(imageables)
        .set({ isCover: true })
        .where(and(owner, eq(imageables.imageId, imageId)))
        .run();
    });
    return Promise.resolve();
  }
}
