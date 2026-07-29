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
HOME_PATH = "artifacts/twixtor-archive/src/pages/home/index.tsx"

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
  height: 320px;
}

.crsl-track {
  display: flex;
  height: 100%;
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
}

.crsl-track {
  display: flex;
  height: 280px;
}""",
    "Move fixed height from container to track (fixes cut-off dots)",
)

replace_once(
    HOME_PATH,
    '<div className="min-h-screen bg-background text-foreground pb-24 md:pb-0">',
    '<div className="min-h-screen bg-background text-foreground pb-24 md:pb-0 overflow-x-hidden">',
    "Add overflow-x-hidden safety net to page wrapper",
)

replace_once(
    HOME_PATH,
    """            <div className="flex justify-start overflow-visible">
              <Carousel
                items={videoItems}
                baseWidth={Math.min(260, typeof window !== "undefined" ? window.innerWidth - 32 : 260)}
                autoplay
                autoplayDelay={3500}
                pauseOnHover
                loop
                round={false}
              />
            </div>""",
    """            <div className="-mx-4 md:-mx-6">
              <Carousel
                items={videoItems}
                baseWidth={typeof window !== "undefined" ? window.innerWidth : 320}
                autoplay
                autoplayDelay={3500}
                pauseOnHover
                loop
                round={false}
              />
            </div>""",
    "Make carousel full-bleed edge-to-edge instead of fixed 260px",
)

print("\nAll patches applied successfully.")
