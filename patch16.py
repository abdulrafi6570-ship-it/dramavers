def replace_once(path, old, new, label):
    with open(path, encoding="utf-8") as f:
        content = f.read()
    count = content.count(old)
    if count != 1:
        raise SystemExit(f"[FAIL] {label}: expected 1, found {count} in {path}")
    content = content.replace(old, new, 1)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"[OK] {label}")

replace_once(
    "lib/db/src/schema/index.ts",
    'export * from "./chat";\nexport * from "./uploads";',
    'export * from "./chat";\nexport * from "./uploads";\nexport * from "./private_messages";',
    "export schema private_messages",
)

replace_once(
    "artifacts/api-server/src/routes/index.ts",
    'import chatRouter from "./chat";',
    'import chatRouter from "./chat";\nimport messagesRouter from "./messages";',
    "import messagesRouter",
)
replace_once(
    "artifacts/api-server/src/routes/index.ts",
    "router.use(usersRouter);",
    "router.use(usersRouter);\nrouter.use(messagesRouter);",
    "register messagesRouter",
)

replace_once(
    "artifacts/twixtor-archive/src/App.tsx",
    'import GlobalChat from "@/pages/chat/index";',
    'import GlobalChat from "@/pages/chat/index";\nimport MessagesInbox from "@/pages/messages/index";\nimport ChatThread from "@/pages/messages/[userId]";',
    "import komponen MessagesInbox & ChatThread",
)

replace_once(
    "artifacts/twixtor-archive/src/App.tsx",
    '<Route path="/chat" component={GlobalChat} />',
    '<Route path="/chat" component={GlobalChat} />\n      <Route path="/messages" component={MessagesInbox} />\n      <Route path="/messages/:userId" component={ChatThread} />',
    "register route /messages",
)

print("\nSelesai! Fitur chat pribadi terpasang.")
