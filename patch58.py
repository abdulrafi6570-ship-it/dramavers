def replace_once(path, old, new, label):
    with open(path, encoding="utf-8") as f:
        content = f.read()
    count = content.count(old)
    if count != 1:
        raise SystemExit(f"[FAIL] {label}: expected 1 match, found {count} in {path}")
    content = content.replace(old, new, 1)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"[OK] {label}")

SCHEMA = "lib/db/src/schema/videos.ts"

replace_once(
    SCHEMA,
    'import { pgTable, text, serial, timestamp, integer, real, pgEnum } from "drizzle-orm/pg-core";',
    'import { pgTable, text, serial, timestamp, integer, real, pgEnum, boolean } from "drizzle-orm/pg-core";',
    "import boolean dari drizzle-orm",
)

replace_once(
    SCHEMA,
    '  tags: text("tags").array().notNull().default([]),',
    '''  tags: text("tags").array().notNull().default([]),
  isOriginal: boolean("is_original").notNull().default(true),
  creditName: text("credit_name"),
  creditUrl: text("credit_url"),''',
    "tambah kolom isOriginal, creditName, creditUrl",
)

print("\nSelesai patch58: skema DB nambah 3 kolom CR.")
