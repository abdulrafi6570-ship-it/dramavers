path = "artifacts/twixtor-archive/src/components/FeedbackButton.tsx"

with open(path, encoding="utf-8") as f:
    c = f.read()

old = '''      <motion.div
        className="hidden md:block fixed bottom-6 right-16 z-40 select-none"
      >'''
new = '''      <motion.div
        className="fixed bottom-24 right-4 md:bottom-6 md:right-16 z-40 select-none"
      >'''

count = c.count(old)
if count != 1:
    raise SystemExit(f"[FAIL] expected 1 match, found {count}")

with open(path, "w", encoding="utf-8") as f:
    f.write(c.replace(old, new))

print("[OK] tombol feedback sekarang tampil juga di mobile")
