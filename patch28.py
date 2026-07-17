import os

# ── 1. Tambah route proxy di backend ──────────────────────────────────────
PROXY_ROUTE = "artifacts/api-server/src/routes/r2proxy.ts"
proxy_content = '''import { Router } from "express";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getR2Client, getR2BucketName } from "../lib/r2";

const router = Router();

router.get("/*", async (req, res) => {
  const key = (req.params as any)[0];
  if (!key) { res.status(400).json({ error: "No key" }); return; }
  try {
    const client = getR2Client();
    const cmd = new GetObjectCommand({ Bucket: getR2BucketName(), Key: key });
    const obj = await client.send(cmd);
    const ct = obj.ContentType ?? "image/jpeg";
    res.setHeader("Content-Type", ct);
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    (obj.Body as any).pipe(res);
  } catch (e: any) {
    res.status(404).json({ error: "Not found" });
  }
});

export default router;
'''
os.makedirs(os.path.dirname(PROXY_ROUTE), exist_ok=True)
with open(PROXY_ROUTE, "w", encoding="utf-8") as f:
    f.write(proxy_content)
print("[OK] buat r2proxy.ts")

# ── 2. Daftarkan route di app.ts / index.ts ────────────────────────────────
import re, glob

candidates = glob.glob("artifacts/api-server/src/app.ts") + \
             glob.glob("artifacts/api-server/src/index.ts") + \
             glob.glob("artifacts/api-server/src/server.ts")

app_file = None
for c in candidates:
    with open(c, encoding="utf-8") as f:
        txt = f.read()
    if "express()" in txt or "Router" in txt or "app.use" in txt:
        app_file = c
        break

if not app_file:
    print("[WARN] tidak ketemu app.ts/index.ts — daftarkan route r2proxy manual")
else:
    with open(app_file, encoding="utf-8") as f:
        content = f.read()

    if "r2proxy" in content:
        print("[SKIP] route r2proxy sudah terdaftar")
    else:
        # Cari import terakhir dan tambahkan import r2proxy
        last_import = list(re.finditer(r"^import .+;$", content, re.MULTILINE))
        if last_import:
            pos = last_import[-1].end()
            content = content[:pos] + '\nimport r2proxyRouter from "./routes/r2proxy";' + content[pos:]
            print("[OK] tambah import r2proxyRouter")

        # Cari app.use pertama dan sisipkan sebelumnya
        m = re.search(r'(app\.use\(["\']\/api)', content)
        if m:
            content = content[:m.start()] + 'app.use("/r2proxy", r2proxyRouter);\n' + content[m.start():]
            print("[OK] daftarkan app.use r2proxy")
        else:
            m2 = re.search(r'app\.listen', content)
            if m2:
                content = content[:m2.start()] + 'app.use("/r2proxy", r2proxyRouter);\n\n' + content[m2.start():]
                print("[OK] daftarkan app.use r2proxy sebelum listen")
            else:
                print("[WARN] tidak ketemu tempat untuk app.use — tambahkan manual:")
                print('  app.use("/r2proxy", r2proxyRouter);')

        with open(app_file, "w", encoding="utf-8") as f:
            f.write(content)

# ── 3. Ubah r2.ts: return proxy URL bukan r2.dev URL ──────────────────────
R2_LIB = "artifacts/api-server/src/lib/r2.ts"
with open(R2_LIB, encoding="utf-8") as f:
    r2content = f.read()

changed = False

# Tambah export getR2Client dan getR2BucketName kalau belum ada
if "export function getR2Client" not in r2content and "export const getR2Client" not in r2content:
    # Cari deklarasi client (biasanya const client = new S3Client)
    m = re.search(r"(const client = new S3Client[^\n]+\n)", r2content)
    if m:
        r2content = r2content.replace(
            m.group(1),
            m.group(1) + "\nexport const getR2Client = () => client;\nexport const getR2BucketName = () => R2_BUCKET_NAME!;\n",
            1
        )
        print("[OK] export getR2Client dan getR2BucketName")
        changed = True
    else:
        print("[WARN] tidak ketemu 'const client = new S3Client' di r2.ts")

# Ubah URL yang dikembalikan dari r2.dev ke proxy URL
old_url_pattern = re.search(
    r"(const base = R2_PUBLIC_URL[^\n]+\n\s*)(return `\$\{base\}\/\$\{key\}`|return `\$\{base\}\$\{key\}`|const url = `\$\{base\}[^`]+`)",
    r2content
)
if old_url_pattern:
    snippet = old_url_pattern.group(0)
    if "BACKEND_URL" not in snippet:
        new_snippet = (
            old_url_pattern.group(1)
            + "const backendBase = (process.env.BACKEND_URL ?? process.env.RAILWAY_PUBLIC_DOMAIN?.replace(/^/, 'https://') ?? R2_PUBLIC_URL!).replace(/\\/$/, '');\n"
            + "  const url = `${backendBase}/r2proxy/${key}`;"
        )
        r2content = r2content.replace(snippet, new_snippet, 1)
        print("[OK] ubah URL return ke proxy URL")
        changed = True
    else:
        print("[SKIP] proxy URL sudah dipakai")
else:
    # Cari pola alternatif: const url = `${...}/${key}`
    m2 = re.search(r"const url = `\$\{[^}]+\}\/\$\{key\}`", r2content)
    if m2 and "BACKEND_URL" not in m2.group(0):
        r2content = r2content.replace(
            m2.group(0),
            "const url = `${(process.env.BACKEND_URL ?? '').replace(/\\/$/, '')}/r2proxy/${key}`",
            1
        )
        print("[OK] ubah URL return ke proxy URL (pola 2)")
        changed = True
    else:
        print("[WARN] tidak ketemu pola URL di r2.ts — ubah manual")
        print("  Ganti baris yang return URL foto menjadi:")
        print("  const url = `${process.env.BACKEND_URL}/r2proxy/${key}`;")

if changed:
    with open(R2_LIB, "w", encoding="utf-8") as f:
        f.write(r2content)

print("\nSelesai patch28.")
print("\n>>> PENTING: set env var BACKEND_URL di Railway:")
print("    BACKEND_URL = https://URL_RAILWAY_KAMU.up.railway.app")
