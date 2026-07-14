import "dotenv/config";
import app from "./app";
import { logger } from "./lib/logger";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { supabaseAdmin, supabaseAnon } from "./lib/supabase";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function ensureSupabaseUser(email: string, password: string): Promise<string | null> {
  const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (!createErr && created.user) return created.user.id;

  const { data: signIn, error: signInErr } = await supabaseAnon.auth.signInWithPassword({ email, password });
  if (!signInErr && signIn.user) return signIn.user.id;

  logger.warn({ createErr, signInErr }, "Could not ensure Supabase user for admin");
  return null;
}

async function seedAdminUser() {
  try {
    const adminUsername = process.env.ADMIN_USERNAME || "rapp";
    const adminPassword = process.env.ADMIN_PASSWORD || "rapp123";
    const adminEmail = `${adminUsername.toLowerCase()}@twixtor.app`;

    const [existing] = await db.select().from(usersTable).where(eq(usersTable.role, "admin"));

    if (!existing) {
      const supabaseId = await ensureSupabaseUser(adminEmail, adminPassword);
      const passwordHash = await bcrypt.hash(adminPassword, 12);
      await db.insert(usersTable).values({
        supabaseId: supabaseId ?? undefined,
        username: adminUsername,
        passwordHash,
        role: "admin",
        verified: true,
      });
      logger.info({ username: adminUsername }, "Admin user seeded — login with the default credentials");
    } else if (!existing.supabaseId) {
      const supabaseId = await ensureSupabaseUser(adminEmail, adminPassword);
      if (supabaseId) {
        await db.update(usersTable).set({ supabaseId }).where(eq(usersTable.id, existing.id));
        logger.info({ username: existing.username }, "Admin Supabase ID linked");
      }
    }
  } catch (err) {
    logger.warn({ err }, "Could not seed admin user (DB may not be ready)");
  }
}

app.listen(port, async (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
  await seedAdminUser();
});
