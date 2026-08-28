const { Client } = require("pg");

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("[FAIL] DATABASE_URL env var not set.");
    process.exit(1);
  }
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const res = await client.query(`
    SELECT conname, pg_get_constraintdef(oid) AS definition
    FROM pg_constraint
    WHERE conrelid = 'dramas'::regclass AND conname = 'dramas_category_check'
  `);
  console.log(res.rows);

  await client.end();
}

main().catch((err) => {
  console.error("[FAIL]", err.message);
  process.exit(1);
});
