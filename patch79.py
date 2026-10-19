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
    'import { useGetSearchSuggestions, getGetSearchSuggestionsQueryKey } from "@workspace/api-client-react";',
    'import { useGetSearchSuggestions, getGetSearchSuggestionsQueryKey, useListDramas, getListDramasQueryKey } from "@workspace/api-client-react";',
    "Import useListDramas for default browse list",
)

replace_once(
    SEARCH_PATH,
    """  const { data, isLoading } = useGetSearchSuggestions(
    { q: query },
    { query: { queryKey: getGetSearchSuggestionsQueryKey({ q: query }), enabled: query.length > 1 } }
  );""",
    """  const { data, isLoading } = useGetSearchSuggestions(
    { q: query },
    { query: { queryKey: getGetSearchSuggestionsQueryKey({ q: query }), enabled: query.length > 1 } }
  );
  const { data: defaultDramas } = useListDramas(
    { limit: 12 },
    { query: { queryKey: getListDramasQueryKey({ limit: 12 }) } }
  );""",
    "Fetch default drama list to show before user types anything",
)

replace_once(
    SEARCH_PATH,
    """        {!query && (
          <div className="text-center py-20">
            <p className="text-white/20 text-sm">Ketik sesuatu untuk mulai mencari</p>
          </div>
        )}""",
    """        {!query && defaultDramas && defaultDramas.dramas.length > 0 && (
          <section>
            <h2 className="font-heading text-base mb-4 text-white/60 uppercase tracking-widest">Semua Drama</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {defaultDramas.dramas.map((drama) => (
                <Link
                  key={drama.id}
                  href={`/dramas/${drama.id}`}
                  className="group aspect-[2/3] relative rounded-lg overflow-hidden glass-panel border-white/5 hover:border-primary/50"
                >
                  {drama.posterUrl && (
                    <img
                      src={drama.posterUrl}
                      className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity"
                      alt={drama.name}
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent flex items-end p-3">
                    <span className="text-sm font-medium text-white line-clamp-2">{drama.name}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}""",
    "Show default drama grid instead of 'ketik sesuatu' placeholder message",
)

print("\nAll patches applied successfully.")
