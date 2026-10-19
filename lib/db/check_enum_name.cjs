const { Client } = require("pg");

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("[FAIL] DATABASE_URL env var not set.");
    process.exit(1);
  }
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const res = await client.query(`
    SELECT column_name, udt_name
    FROM information_schema.columns
    WHERE table_name = 'dramas' AND column_name = 'category'
  `);
  console.log(res.rows);

  await client.end();
}

main().catch((err) => {
  console.error("[FAIL]", err.message);
  process.exit(1);
});
