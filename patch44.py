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

AI_ROUTE = "artifacts/api-server/src/routes/ai.ts"
AI_WIDGET = "artifacts/twixtor-archive/src/components/AiVideoChat.tsx"

replace_once(
    AI_ROUTE,
    "  videoId: z.number().int().positive().optional(),",
    "  videoId: z.coerce.number().int().positive().optional(),",
    "backend: terima videoId walau dikirim sebagai string",
)

replace_once(
    AI_WIDGET,
    '''        body: JSON.stringify({
          message: text,
          videoId,
          history: newMessages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
        }),''',
    '''        body: JSON.stringify({
          message: text,
          videoId: videoId !== undefined && videoId !== null ? Number(videoId) : undefined,
          history: newMessages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
        }),''',
    "frontend: paksa videoId jadi number sebelum dikirim",
)

print("\nSelesai patch44: videoId sekarang selalu number, gak akan invalid_type lagi.")
