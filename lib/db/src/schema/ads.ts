import { pgTable, serial, text, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";

export const adTypeEnum = pgEnum("ad_type", ["image", "video"]);

export const adsTable = pgTable("ads", {
  id: serial("id").primaryKey(),
  type: adTypeEnum("type").notNull().default("image"),
  mediaUrl: text("media_url").notNull(),
  title: text("title"),
  description: text("description"),
  durationSeconds: integer("duration_seconds").default(5),
  linkUrl: text("link_url"),
  active: boolean("active").notNull().default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
