import { pgTable, integer, primaryKey } from "drizzle-orm/pg-core";
import { dramasTable } from "./dramas";
import { actorsTable } from "./actors";

export const dramaActorsTable = pgTable("drama_actors", {
  dramaId: integer("drama_id").notNull().references(() => dramasTable.id, { onDelete: "cascade" }),
  actorId: integer("actor_id").notNull().references(() => actorsTable.id, { onDelete: "cascade" }),
}, (t) => [primaryKey({ columns: [t.dramaId, t.actorId] })]);

export type DramaActor = typeof dramaActorsTable.$inferSelect;
