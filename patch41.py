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

ROUTES_INDEX = "artifacts/api-server/src/routes/index.ts"

replace_once(
    ROUTES_INDEX,
    'import chatRouter from "./chat";',
    'import chatRouter from "./chat";\nimport aiRouter from "./ai";',
    "tambah import aiRouter",
)

replace_once(
    ROUTES_INDEX,
    "router.use(chatRouter);",
    "router.use(chatRouter);\nrouter.use(aiRouter);",
    "daftarin aiRouter",
)

print("\nSelesai patch41: route /api/ai/chat aktif.")
