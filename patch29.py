import re, os, glob

# ── 1. Buat r2proxy.ts yang bersih ────────────────────────────────────────
PROXY_FILE = "artifacts/api-server/src/routes/r2proxy.ts"
os.makedirs(os.path.dirname(PROXY_FILE), exist_ok=True)
with open(PROXY_FILE, "w", encoding="utf-8") as f:
    f.write(
        'import { Router, Request, Response } from "express";\n'
        'import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";\n'
        'import { Readable } from "stream";\n\n'
        'const router = Router();\n\n'
        'function getClient(): S3Client {\n'
        '  return new S3Client({\n'
        '    region: "auto",\n'
        '    endpoint: `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,\n'
        '    credentials: {\n'
        '      accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,\n'
        '      secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,\n'
        '    },\n'
        '  });\n'
        '}\n\n'
        'router.get("/*", async (req: Request, res: Response): Promise<void> => {\n'
        '  const key = (req.params as Record<string, string>)[0];\n'
        '  if (!key) { res.status(400).json({ error: "No key" }); return; }\n'
        '  try {\n'
        '    const cmd = new GetObjectCommand({\n'
        '      Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME!,\n'
        '      Key: key,\n'
        '    });\n'
        '    const obj = await getClient().send(cmd);\n'
        '    res.setHeader("Content-Type", obj.ContentType ?? "image/jpeg");\n'
        '    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");\n'
        '    (obj.Body as Readable).pipe(res);\n'
        '  } catch {\n'
        '    res.status(404).json({ error: "Not found" });\n'
        '  }\n'
        '});\n\n'
        'export default router;\n'
    )
print("[OK] buat r2proxy.ts")

# ── 2. Daftarkan route di app/index/server.ts ─────────────────────────────
candidates = (
    glob.glob("artifacts/api-server/src/app.ts") +
    glob.glob("artifacts/api-server/src/index.ts") +
    glob.glob("artifacts/api-server/src/server.ts")
)
app_file = None
for c in candidates:
    with open(c, encoding="utf-8") as f:
        txt = f.read()
    if "app.use" in txt:
        app_file = c
        break

if not app_file:
    print("[WARN] tidak ketemu file app utama, tambahkan manual:")
    print('  import r2proxyRouter from "./routes/r2proxy";')
    print('  app.use("/r2proxy", r2proxyRouter);')
else:
    with open(app_file, encoding="utf-8") as f:
        content = f.read()

    if "r2proxy" in content:
        print("[SKIP] r2proxy sudah terdaftar di", app_file)
    else:
        last_import = list(re.finditer(r'^import .+;$', content, re.MULTILINE))
        if last_import:
            pos = last_import[-1].end()
            content = content[:pos] + '\nimport r2proxyRouter from "./routes/r2proxy";' + content[pos:]

        m = re.search(r'app\.use\(', content)
        if m:
            content = content[:m.start()] + 'app.use("/r2proxy", r2proxyRouter);\n' + content[m.start():]
        else:
            content += '\napp.use("/r2proxy", r2proxyRouter);\n'

        with open(app_file, "w", encoding="utf-8") as f:
            f.write(content)
        print("[OK] daftarkan r2proxy di", app_file)

# ── 3. Ubah URL di r2.ts ──────────────────────────────────────────────────
R2_FILE = "artifacts/api-server/src/lib/r2.ts"
with open(R2_FILE, encoding="utf-8") as f:
    r2 = f.read()

# Cari baris yang return/assign URL publik (mengandung key dan r2.dev atau R2_PUBLIC_URL)
# Ganti dengan proxy URL
changed = False
m = re.search(r'const url = `\$\{[^`]+\}\$\{key\}`;', r2)
if not m:
    m = re.search(r'const url = `\$\{[^`]+\}\/\$\{key\}`;', r2)
if m and "r2proxy" not in m.group(0):
    new_url = 'const url = `${(process.env.BACKEND_URL || "").replace(/\\/$/, "")}/r2proxy/${key}`;'
    r2 = r2.replace(m.group(0), new_url, 1)
    print("[OK] ubah URL return ke proxy di r2.ts")
    changed = True
else:
    print("[SKIP] URL di r2.ts sudah proxy atau polanya beda")
    # Coba pola return langsung
    m2 = re.search(r'return `\$\{[^`]+\}\/\$\{key\}`;', r2)
    if m2 and "r2proxy" not in m2.group(0):
        new_ret = 'return `${(process.env.BACKEND_URL || "").replace(/\\/$/, "")}/r2proxy/${key}`;'
        r2 = r2.replace(m2.group(0), new_ret, 1)
        print("[OK] ubah return URL ke proxy di r2.ts (pola 2)")
        changed = True

if changed:
    with open(R2_FILE, "w", encoding="utf-8") as f:
        f.write(r2)

print("\nSelesai patch29.")
print("Set env BACKEND_URL di Railway = URL backend kamu (contoh: https://dramavers-production.up.railway.app)")
