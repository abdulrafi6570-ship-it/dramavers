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

SEARCH_PATH = "artifacts/twixtor-archive/src/pages/search/index.tsx"

replace_once(
    SEARCH_PATH,
    'import { useState } from "react";',
    'import { useState, useEffect } from "react";',
    "Import useEffect into Search page",
)

replace_once(
    SEARCH_PATH,
    'import { VideoCard } from "@/components/video/VideoCard";',
    'import { VideoCard } from "@/components/video/VideoCard";\nimport { X } from "lucide-react";',
    "Import X icon for removable history chips",
)

replace_once(
    SEARCH_PATH,
    """export default function Search() {
  const [query, setQuery] = useState("");""",
    """const RECENT_SEARCHES_KEY = "twixtor_recent_searches";

function loadRecentSearches(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export default function Search() {
  const [query, setQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>(loadRecentSearches);""",
    "Add recentSearches state, loaded from localStorage",
)

replace_once(
    SEARCH_PATH,
    """  const { data: defaultDramas } = useListDramas(
    { limit: 12 },
    { query: { queryKey: getListDramasQueryKey({ limit: 12 }) } }
  );""",
    """  const { data: defaultDramas } = useListDramas(
    { limit: 12 },
    { query: { queryKey: getListDramasQueryKey({ limit: 12 }) } }
  );

  // Remember what was searched — but only once the person pauses typing for
  // a bit, so we don't fill up history with every half-typed keystroke.
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) return;
    const timer = setTimeout(() => {
      setRecentSearches((prev) => {
        const next = [trimmed, ...prev.filter((t) => t.toLowerCase() !== trimmed.toLowerCase())].slice(0, 10);
        try { localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next)); } catch {}
        return next;
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, [query]);

  const removeRecentSearch = (term: string) => {
    setRecentSearches((prev) => {
      const next = prev.filter((t) => t !== term);
      try { localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  };""",
    "Save recent search terms (debounced) and add a remove helper",
)

replace_once(
    SEARCH_PATH,
    """        {!query && defaultDramas && defaultDramas.dramas.length > 0 && (""",
    """        {!query && recentSearches.length > 0 && (
          <div className="mb-8">
            <h2 className="font-heading text-base mb-3 text-white/60 uppercase tracking-widest">Pencarian Terakhir</h2>
            <div className="flex flex-wrap gap-2">
              {recentSearches.map((term) => (
                <div
                  key={term}
                  className="bg-[#11111198] px-2 py-1 rounded-xl text-sm flex items-center gap-1 border border-white/10 text-white"
                >
                  <button type="button" onClick={() => setQuery(term)} className="hover:text-white/80">
                    {term}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeRecentSearch(term)}
                    className="rounded-full p-1 hover:bg-[#11111136] text-white/50 hover:text-white"
                    aria-label={`Hapus "${term}" dari riwayat`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {!query && defaultDramas && defaultDramas.dramas.length > 0 && (""",
    "Render recent-search chips above the default drama browse list",
)

print("\nAll patches applied successfully.")
