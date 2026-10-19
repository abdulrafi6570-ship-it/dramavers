import { pgTable, integer, primaryKey, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { dramasTable } from "./dramas";

export const dramaFavoritesTable = pgTable("drama_favorites", {
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  dramaId: integer("drama_id").notNull().references(() => dramasTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [primaryKey({ columns: [t.userId, t.dramaId] })]);

export type DramaFavorite = typeof dramaFavoritesTable.$inferSelect;
