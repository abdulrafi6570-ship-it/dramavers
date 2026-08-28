const { Client } = require("pg");

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("[FAIL] DATABASE_URL env var not set. Run: export DATABASE_URL='...' first.");
    process.exit(1);
  }
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  await client.query("BEGIN");
  try {
    const deleted = await client.query(`DELETE FROM dramas WHERE category = 'series' RETURNING id`);
    console.log(`[OK] Deleted ${deleted.rowCount} drama(s) that were in old "series" category`);

    await client.query(`CREATE TYPE category_new AS ENUM ('asia', 'donghua', 'anime', 'western', 'animasi', 'manhwa')`);
    await client.query(`ALTER TABLE dramas ADD COLUMN category_v2 category_new`);

    await client.query(`
      UPDATE dramas SET category_v2 = CASE category::text
        WHEN 'kdrama' THEN 'asia'
        WHEN 'cdrama' THEN 'asia'
        WHEN 'indo' THEN 'asia'
        WHEN 'film_barat' THEN 'western'
        WHEN 'anime' THEN 'anime'
        ELSE 'asia'
      END::category_new
    `);

    await client.query(`ALTER TABLE dramas ALTER COLUMN category_v2 SET NOT NULL`);
    await client.query(`ALTER TABLE dramas ALTER COLUMN category_v2 SET DEFAULT 'asia'`);

    await client.query(`ALTER TABLE dramas DROP COLUMN category`);
    await client.query(`DROP TYPE category`);
    await client.query(`ALTER TABLE dramas RENAME COLUMN category_v2 TO category`);
    await client.query(`ALTER TYPE category_new RENAME TO category`);

    await client.query("COMMIT");
    console.log("[OK] Category enum migrated: asia, donghua, anime, western, animasi, manhwa");
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
