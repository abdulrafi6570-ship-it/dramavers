path = "/data/data/com.termux/files/home/dramaverse/artifacts/api-server/src/routes/messages.ts"
with open(path, encoding="utf-8") as f:
    src = f.read()

# Bug: pg driver bisa return ID sebagai string dari raw SQL,
# tapi Drizzle select return sebagai number — Map.get() gagal karena beda type
# Fix: pakai String() untuk semua key di partnerMap dan unreadMap

# Fix partnerMap: pakai String key
src = src.replace(
    "const partnerMap = new Map(partners.map((p) => [p.id, p]));",
    "const partnerMap = new Map(partners.map((p) => [String(p.id), p]));"
)

# Fix lookup partnerMap
src = src.replace(
    "const partner = partnerMap.get(Number(r.partner_id));",
    "const partner = partnerMap.get(String(r.partner_id));"
)

# Fix unreadMap key juga
src = src.replace(
    "[Number(r.sender_id), Number(r.cnt)]",
    "[String(r.sender_id), Number(r.cnt)]"
)
src = src.replace(
    "unreadMap.get(Number(r.partner_id))",
    "unreadMap.get(String(r.partner_id))"
)

with open(path, "w", encoding="utf-8") as f:
    f.write(src)

print("✓ Fix partnerMap — String key supaya ID tidak mismatch type")
