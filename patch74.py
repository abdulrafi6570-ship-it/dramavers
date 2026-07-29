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

CSS_PATH = "artifacts/twixtor-archive/src/components/Carousel.css"

replace_once(
    CSS_PATH,
    """.crsl-container {
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  padding: 12px;
  --outer-r: 20px;
  --p-distance: 10px;
  background: rgba(255, 255, 255, 0.02);
}""",
    """.crsl-container {
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  padding: 12px;
  --outer-r: 20px;
  --p-distance: 10px;
  background: rgba(255, 255, 255, 0.02);
  height: 320px;
}""",
    "Add fixed height to .crsl-container",
)

replace_once(
    CSS_PATH,
    """.crsl-track {
  display: flex;
}""",
    """.crsl-track {
  display: flex;
  height: 100%;
}""",
    "Add height:100% to .crsl-track",
)

print("\nAll patches applied successfully.")
