path = "artifacts/twixtor-archive/src/components/FeedbackButton.tsx"

with open(path, encoding="utf-8") as f:
    c = f.read()

def replace_once(content, old, new, label):
    count = content.count(old)
    if count != 1:
        raise SystemExit(f"[FAIL] {label}: expected 1 match, found {count}")
    print(f"[OK] {label}")
    return content.replace(old, new, 1)

c = replace_once(
    c,
    '  const constraintsRef = useRef(null);\n  const panelConstraintsRef = useRef(null);',
    '  const constraintsRef = useRef(null);\n  const panelConstraintsRef = useRef(null);\n  const isDraggingRef = useRef(false);',
    "tambah isDraggingRef",
)

c = replace_once(
    c,
    '''      <motion.div
        className="fixed bottom-24 right-4 md:bottom-6 md:right-16 z-40 select-none"
      >''',
    '''      <motion.div
        drag
        dragMomentum={false}
        dragElastic={0}
        dragConstraints={constraintsRef}
        onDragStart={() => { isDraggingRef.current = true; }}
        onDragEnd={() => { setTimeout(() => { isDraggingRef.current = false; }, 0); }}
        whileDrag={{ scale: 1.05 }}
        className="fixed bottom-24 right-4 md:bottom-6 md:right-16 z-40 select-none touch-none"
        style={{ cursor: "grab" }}
      >''',
    "aktifin drag di tombol trigger",
)

c = replace_once(
    c,
    '            onClick={() => setOpen((o) => !o)}',
    '            onClick={() => { if (isDraggingRef.current) return; setOpen((o) => !o); }}',
    "cegah drag keanggep klik",
)

with open(path, "w", encoding="utf-8") as f:
    f.write(c)

print("\nSelesai patch40: tombol feedback sekarang bisa digeser bebas ke mana aja di layar.")
