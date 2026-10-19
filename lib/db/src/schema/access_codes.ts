import { pgTable, text, integer, serial, timestamp, boolean } from "drizzle-orm/pg-core";

export const accessCodesTable = pgTable("access_codes", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  active: boolean("active").notNull().default(true),
  expiredAt: timestamp("expired_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type AccessCode = typeof accessCodesTable.$inferSelect;
