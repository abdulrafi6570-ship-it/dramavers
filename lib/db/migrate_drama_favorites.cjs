const { Client } = require("pg");

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("[FAIL] DATABASE_URL env var not set. Run: export DATABASE_URL='...' first.");
    process.exit(1);
  }
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  await client.query(`
    CREATE TABLE IF NOT EXISTS drama_favorites (
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      drama_id INTEGER NOT NULL REFERENCES dramas(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      PRIMARY KEY (user_id, drama_id)
    );
  `);
  console.log("[OK] drama_favorites table created (or already existed)");
  await client.end();
}

main().catch((err) => {
  console.error("[FAIL]", err.message);
  process.exit(1);
});
