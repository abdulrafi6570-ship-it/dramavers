import { pgTable, text, serial, timestamp, integer, real, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { dramasTable } from "./dramas";
import { actorsTable } from "./actors";

export const videoTypeEnum = pgEnum("video_type", ["slomo", "non_slomo"]);
export const videoStatusEnum = pgEnum("video_status", ["draft", "published", "hidden", "processing", "broken"]);

export const videosTable = pgTable("videos", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  dramaId: integer("drama_id").references(() => dramasTable.id, { onDelete: "set null" }),
  actorId: integer("actor_id").references(() => actorsTable.id, { onDelete: "set null" }),
  episode: text("episode"),
  scene: text("scene"),
  videoUrl: text("video_url"),
  thumbnailUrl: text("thumbnail_url"),
  type: videoTypeEnum("type").notNull().default("slomo"),
  status: videoStatusEnum("status").notNull().default("draft"),
  resolution: text("resolution"),
  fps: integer("fps"),
  duration: integer("duration"),
  fileSize: integer("file_size"),
  format: text("format"),
  tags: text("tags").array().notNull().default([]),
  viewCount: integer("view_count").notNull().default(0),
  downloadCount: integer("download_count").notNull().default(0),
  favoriteCount: integer("favorite_count").notNull().default(0),
  popularityScore: real("popularity_score").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertVideoSchema = createInsertSchema(videosTable).omit({ id: true, createdAt: true, viewCount: true, downloadCount: true, favoriteCount: true });
export type InsertVideo = z.infer<typeof insertVideoSchema>;
export type Video = typeof videosTable.$inferSelect;
