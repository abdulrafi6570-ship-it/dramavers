const { Client } = require("pg");

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("[FAIL] DATABASE_URL env var not set. Run: export DATABASE_URL='...' first.");
    process.exit(1);
  }
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  await client.query(`
    CREATE TABLE IF NOT EXISTS user_login_days (
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      login_date DATE NOT NULL,
      PRIMARY KEY (user_id, login_date)
    );
  `);
  console.log("[OK] user_login_days table created (or already existed)");
  await client.end();
}

main().catch((err) => {
  console.error("[FAIL]", err.message);
  process.exit(1);
});
