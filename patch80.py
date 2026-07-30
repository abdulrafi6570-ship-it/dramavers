import sys

def replace_once(path, old, new, label):
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    count = content.count(old)
    if count != 1:
        print(f"[FAIL] {label}: expected 1 match, found {count} in {path}")
        sys.exit(1)
    content = content.replace(old, new)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"[OK] {label}")

CARD_PATH = "artifacts/twixtor-archive/src/components/video/VideoCard.tsx"

replace_once(
    CARD_PATH,
    """import { Video } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";""",
    """import { Video } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Copyright } from "lucide-react";
import { Button } from "@/components/ui/button";""",
    "Import Copyright icon into VideoCard",
)

replace_once(
    CARD_PATH,
    """      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

      <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">""",
    """      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

      {/* CR badge — cuma muncul kalau video BUKAN buatan sendiri */}
      {!(video as any).isOriginal && (
        <div className="absolute top-2 left-2 flex items-center gap-0.5 bg-amber-400/90 text-black text-[9px] font-bold px-1.5 py-0.5 rounded">
          <Copyright className="h-2.5 w-2.5" />
          CR
        </div>
      )}

      <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">""",
    "Show CR badge on video card thumbnail when video is not original",
)

print("\nAll patches applied successfully.")
