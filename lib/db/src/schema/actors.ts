import { pgTable, text, serial, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const actorTypeEnum = pgEnum("actor_type", ["drama", "solo"]);

export const actorsTable = pgTable("actors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  photoUrl: text("photo_url"),
  type: actorTypeEnum("type").notNull().default("drama"),
  bio: text("bio"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertActorSchema = createInsertSchema(actorsTable).omit({ id: true, createdAt: true });
export type InsertActor = z.infer<typeof insertActorSchema>;
export type Actor = typeof actorsTable.$inferSelect;
