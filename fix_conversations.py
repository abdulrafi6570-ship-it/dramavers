path = "/data/data/com.termux/files/home/dramaverse/artifacts/api-server/src/routes/messages.ts"
with open(path, encoding="utf-8") as f:
    src = f.read()

# Bug: db.execute() dengan driver pg mengembalikan {rows: [...]} bukan array langsung
# Fix: tambah .rows di setiap akses hasil db.execute()

# Fix 1: partnerIds dari rows
src = src.replace(
    "const partnerIds = (rows as any).map((r: any) => Number(r.partner_id));",
    "const partnerIds = ((rows as any).rows as any[]).map((r: any) => Number(r.partner_id));"
)

# Fix 2: unreadMap dari unreadCounts
src = src.replace(
    "const unreadMap = new Map((unreadCounts as any).map((r: any) => [Number(r.sender_id), Number(r.cnt)]));",
    "const unreadMap = new Map(((unreadCounts as any).rows as any[]).map((r: any) => [Number(r.sender_id), Number(r.cnt)]));"
)

# Fix 3: res.json dari rows
src = src.replace(
    "res.json(\n    (rows as any).map((r: any) => {",
    "res.json(\n    ((rows as any).rows as any[]).map((r: any) => {"
)
# Fallback kalau formatnya berbeda
if "(rows as any).map((r: any) => {" in src:
    src = src.replace(
        "(rows as any).map((r: any) => {",
        "((rows as any).rows as any[]).map((r: any) => {"
    )

with open(path, "w", encoding="utf-8") as f:
    f.write(src)

print("✓ Fix berhasil — conversations sekarang pakai .rows dari QueryResult")
