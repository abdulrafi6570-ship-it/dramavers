import { pgTable, text, serial, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const roleEnum = pgEnum("role", ["user", "admin"]);

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  supabaseId: text("supabase_id").unique(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull().default(""),
  role: roleEnum("role").notNull().default("user"),
  verified: boolean("verified").notNull().default(false),
  photoUrl: text("photo_url"),
  bio: text("bio"),
  isPrivate: boolean("is_private").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
