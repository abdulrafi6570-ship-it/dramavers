import { pgTable, integer, primaryKey, timestamp } from "drizzle-orm/pg-core";
import { collectionsTable } from "./collections";
import { videosTable } from "./videos";

export const collectionVideosTable = pgTable("collection_videos", {
  collectionId: integer("collection_id").notNull().references(() => collectionsTable.id, { onDelete: "cascade" }),
  videoId: integer("video_id").notNull().references(() => videosTable.id, { onDelete: "cascade" }),
  addedAt: timestamp("added_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [primaryKey({ columns: [t.collectionId, t.videoId] })]);

export type CollectionVideo = typeof collectionVideosTable.$inferSelect;
