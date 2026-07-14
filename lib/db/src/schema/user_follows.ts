import { pgTable, serial, integer, timestamp, unique } from "drizzle-orm/pg-core";

export const userFollowsTable = pgTable("user_follows", {
  id: serial("id").primaryKey(),
  followerId: integer("follower_id").notNull(),
  followingId: integer("following_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  unique().on(t.followerId, t.followingId),
]);

export type UserFollow = typeof userFollowsTable.$inferSelect;
