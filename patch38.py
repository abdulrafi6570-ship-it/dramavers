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

APP = "artifacts/twixtor-archive/src/App.tsx"
NAVBAR = "artifacts/twixtor-archive/src/components/layout/Navbar.tsx"

replace_once(
    APP,
    'import GlobalChat from "@/pages/chat/index";',
    'import GlobalChat from "@/pages/chat/index";\nimport Help from "@/pages/help/index";',
    "tambah import halaman Help",
)

replace_once(
    APP,
    '      <Route path="/chat" component={GlobalChat} />',
    '      <Route path="/chat" component={GlobalChat} />\n      <Route path="/bantuan" component={Help} />',
    "tambah route /bantuan",
)

replace_once(
    NAVBAR,
    '    { href: "/search", label: "Search" },\n  ];',
    '    { href: "/search", label: "Search" },\n    { href: "/bantuan", label: "Bantuan" },\n  ];',
    "tambah link Bantuan di navbar desktop",
)

replace_once(
    NAVBAR,
    '''    {
      label: "Search",
      onClick: () => setLocation("/search"),
      hoverStyles: { bgColor: "rgba(74,222,128,0.2)", textColor: "#4ade80" },
    },''',
    '''    {
      label: "Search",
      onClick: () => setLocation("/search"),
      hoverStyles: { bgColor: "rgba(74,222,128,0.2)", textColor: "#4ade80" },
    },
    {
      label: "Bantuan",
      onClick: () => setLocation("/bantuan"),
      hoverStyles: { bgColor: "rgba(148,163,184,0.2)", textColor: "#94a3b8" },
    },''',
    "tambah item Bantuan di menu mobile (bubble menu)",
)

print("\nSelesai patch38.")
