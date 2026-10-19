import { pgTable, integer, serial, text, timestamp, unique } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { videosTable } from "./videos";

export const videoViewsTable = pgTable("video_views", {
  id: serial("id").primaryKey(),
  videoId: integer("video_id").notNull().references(() => videosTable.id, { onDelete: "cascade" }),
  userId: integer("user_id").references(() => usersTable.id, { onDelete: "cascade" }),
  ipAddress: text("ip_address"),
  viewedAt: timestamp("viewed_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  unique("uq_video_view_user").on(t.videoId, t.userId),
  unique("uq_video_view_ip").on(t.videoId, t.ipAddress),
]);

export type VideoView = typeof videoViewsTable.$inferSelect;
