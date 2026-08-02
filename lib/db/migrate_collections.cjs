const { Client } = require("pg");

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("[FAIL] DATABASE_URL env var not set. Run: export DATABASE_URL='...' first.");
    process.exit(1);
  }
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  await client.query(`
    CREATE TABLE IF NOT EXISTS collections (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  await client.query(`
    CREATE TABLE IF NOT EXISTS collection_videos (
      collection_id INTEGER NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
      video_id INTEGER NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
      added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      PRIMARY KEY (collection_id, video_id)
    );
  `);
  console.log("[OK] collections + collection_videos tables created (or already existed)");
  await client.end();
}

main().catch((err) => {
  console.error("[FAIL]", err.message);
  process.exit(1);
});
