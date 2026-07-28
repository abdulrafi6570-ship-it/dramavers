import pg from "pg";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL belum di-set. Jalanin dengan: DATABASE_URL=... node push-cr-columns.mjs");
  process.exit(1);
}

const client = new pg.Client({ connectionString: DATABASE_URL });

async function main() {
  await client.connect();
  console.log("Terhubung ke database...");

  await client.query(`ALTER TABLE videos ADD COLUMN IF NOT EXISTS is_original boolean NOT NULL DEFAULT true;`);
  console.log("[OK] kolom is_original siap");

  await client.query(`ALTER TABLE videos ADD COLUMN IF NOT EXISTS credit_name text;`);
  console.log("[OK] kolom credit_name siap");

  await client.query(`ALTER TABLE videos ADD COLUMN IF NOT EXISTS credit_url text;`);
  console.log("[OK] kolom credit_url siap");

  await client.end();
  console.log("\nSelesai! Kolom CR udah ada di tabel videos.");
}

main().catch((err) => {
  console.error("Gagal:", err.message);
  process.exit(1);
});
