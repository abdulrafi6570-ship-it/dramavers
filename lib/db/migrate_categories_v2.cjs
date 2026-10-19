const { Client } = require("pg");

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("[FAIL] DATABASE_URL env var not set.");
    process.exit(1);
  }
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  await client.query("BEGIN");
  try {
    const updated = await client.query(`
      UPDATE dramas SET category = CASE category
        WHEN 'kdrama' THEN 'asia'
        WHEN 'cdrama' THEN 'asia'
        WHEN 'indo' THEN 'asia'
        WHEN 'film_barat' THEN 'western'
        WHEN 'anime' THEN 'anime'
        ELSE 'asia'
      END
      RETURNING id
    `);
    console.log(`[OK] Remapped ${updated.rowCount} drama(s) to new category values`);

    await client.query(`ALTER TABLE dramas ALTER COLUMN category SET DEFAULT 'asia'`);
    console.log("[OK] Default category set to 'asia'");

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("[FAIL]", err.message);
  process.exit(1);
});
