import { pgTable, text, integer, serial, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const contentRequestsTable = pgTable("content_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  drama: text("drama").notNull(),
  actor: text("actor"),
  scene: text("scene"),
  episode: text("episode"),
  votes: integer("votes").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const requestVotesTable = pgTable("request_votes", {
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  requestId: integer("request_id").notNull().references(() => contentRequestsTable.id, { onDelete: "cascade" }),
});

export type ContentRequest = typeof contentRequestsTable.$inferSelect;
