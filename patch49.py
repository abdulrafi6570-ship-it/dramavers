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

WIDGET = "artifacts/twixtor-archive/src/components/AiVideoChat.tsx"

replace_once(
    WIDGET,
    'import { Send, Sparkles, Loader2 } from "lucide-react";',
    'import { Send, Sparkles, Loader2 } from "lucide-react";\nimport { Link } from "wouter";',
    "import Link dari wouter",
)

replace_once(
    WIDGET,
    '''interface Message {
  role: "user" | "assistant";
  content: string;
}''',
    '''interface Message {
  role: "user" | "assistant";
  content: string;
}

function renderMessageContent(content: string) {
  const parts = content.split(/(\\/videos\\/\\d+)/g);
  return parts.map((part, i) =>
    /^\\/videos\\/\\d+$/.test(part) ? (
      <Link
        key={i}
        href={part}
        className="underline decoration-white/30 underline-offset-2 text-white font-medium hover:text-white/80"
      >
        {part}
      </Link>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}''',
    "tambah fungsi render link video",
)

replace_once(
    WIDGET,
    "                {m.content}",
    "                {renderMessageContent(m.content)}",
    "pakai renderMessageContent buat tampilin pesan AI",
)

print("\nSelesai patch49: link /videos/xxx di jawaban AI sekarang bisa diklik.")
