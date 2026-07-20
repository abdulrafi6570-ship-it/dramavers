import { pgTable, serial, integer, varchar, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const chatMessagesTable = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => usersTable.id, { onDelete: "set null" }),
  username: varchar("username", { length: 50 }),
  photoUrl: text("photo_url"),
  message: text("message").notNull(),
  replyToId: integer("reply_to_id"),
  deleted: boolean("deleted").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
