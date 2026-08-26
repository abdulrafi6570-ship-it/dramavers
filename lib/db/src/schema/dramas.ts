import { pgTable, text, serial, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const categoryEnum = pgEnum("category", [
  "kdrama",
  "cdrama",
  "indo",
  "film_barat",
  "anime",
  "series",
]);

export const mainCategoryEnum = pgEnum("main_category", [
  "ASIA",
  "DONGHUA",
  "ANIME",
  "WESTERN",
  "ANIMASI",
  "MANHWA",
  "K-POP",
]);

export const subcategoryEnum = pgEnum("subcategory", [
  "K-DRAMA",
  "C-DRAMA",
  "J-DRAMA",
  "T-DRAMA",
  "TAIWAN-DRAMA",
  "PHILIPPINES-DRAMA",
]);

export const dramasTable = pgTable("dramas", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  posterUrl: text("poster_url"),
  description: text("description"),

  // Legacy category — jangan hapus dulu
  category: categoryEnum("category").notNull().default("kdrama"),

  // Kategori baru
  parentCategory: mainCategoryEnum("parent_category")
    .notNull()
    .default("ASIA"),

  subcategory: subcategoryEnum("subcategory"),

  genre: text("genre"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertDramaSchema = createInsertSchema(dramasTable).omit({
  id: true,
  createdAt: true,
});

export type InsertDrama = z.infer<typeof insertDramaSchema>;
export type Drama = typeof dramasTable.$inferSelect;
