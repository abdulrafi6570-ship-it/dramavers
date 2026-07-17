import re

path = "artifacts/twixtor-archive/src/components/FeedbackButton.tsx"
with open(path, encoding="utf-8") as f:
    content = f.read()

pattern = r'className="hidden md:block fixed bottom-6 right-16 z-40 select-none"'
new_content, n = re.subn(pattern, 'className="fixed bottom-24 right-20 z-40 select-none"', content, count=1)
if n != 1:
    raise SystemExit(f"[FAIL] FeedbackButton: {n} match")
with open(path, "w", encoding="utf-8") as f:
    f.write(new_content)
print("[OK] FeedbackButton: muncul lagi di HP, posisi digeser biar ga nabrak musik & input chat")
