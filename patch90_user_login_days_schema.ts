import { pgTable, integer, date, primaryKey } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const userLoginDaysTable = pgTable("user_login_days", {
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  loginDate: date("login_date", { mode: "string" }).notNull(),
}, (t) => [primaryKey({ columns: [t.userId, t.loginDate] })]);

export type UserLoginDay = typeof userLoginDaysTable.$inferSelect;
