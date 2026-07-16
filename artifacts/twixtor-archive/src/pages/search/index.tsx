import { useGetSearchSuggestions, getGetSearchSuggestionsQueryKey } from "@workspace/api-client-react";
import { Navbar } from "@/components/layout/Navbar";
import { useState } from "react";
import GlowingSearchBar from "@/components/ui/animated-glowing-search-bar";
import { Link } from "wouter";

function WifiLoader() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div className="wifi-loader">
        <svg className="back-circle" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" />
        </svg>
        <svg className="front-circle" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" />
        </svg>
        <div className="wifi-dots">
          <div className="wifi-dot" />
          <div className="wifi-dot" />
          <div className="wifi-dot" />
        </div>
      </div>
      <p className="text-white/40 text-sm tracking-widest uppercase">Searching...</p>
    </div>
  );
}

export default function Search() {
  const [query, setQuery] = useState("");
  const { data, isLoading } = useGetSearchSuggestions(
    { q: query },
    { query: { queryKey: getGetSearchSuggestionsQueryKey({ q: query }), enabled: query.length > 1 } }
  );

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 md:pb-0">
      <Navbar />
      <main className="container mx-auto px-4 md:px-6 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="font-brand text-3xl tracking-[0.06em] text-white mb-1">Cari</h1>
          <p className="text-sm text-white/35">Temukan drama, aktor, atau video favorit kamu</p>
        </div>

        <div className="mb-10">
          <GlowingSearchBar
            value={query}
            onChange={setQuery}
            placeholder="Cari drama, aktor, atau video..."
          />
        </div>

        {query.length > 1 && isLoading && <WifiLoader />}

        {!query && (
          <div className="text-center py-20">
            <p className="text-white/20 text-sm">Ketik sesuatu untuk mulai mencari</p>
          </div>
        )}

        {data && (
          <div className="space-y-10">
            {data.dramas && data.dramas.length > 0 && (
              <section>
                <h2 className="font-heading text-base mb-4 text-white/60 uppercase tracking-widest">Dramas</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {data.dramas.map((drama) => (
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
            )}

            {data.actors && data.actors.length > 0 && (
              <section>
                <h2 className="font-heading text-base mb-4 text-white/60 uppercase tracking-widest">Aktor & Artis</h2>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                  {data.actors.map((actor) => (
                    <Link
                      key={actor.id}
                      href={`/actors/${actor.id}`}
                      className="group flex flex-col items-center text-center gap-2"
                    >
                      <div className="aspect-square w-full rounded-full overflow-hidden glass-panel border-white/5 group-hover:border-primary/50">
                        {actor.photoUrl && (
                          <img
                            src={actor.photoUrl}
                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                            alt={actor.name}
                          />
                        )}
                        {!actor.photoUrl && (
                          <div className="w-full h-full flex items-center justify-center text-white/20 font-bold text-xl">
                            {actor.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <span className="text-sm font-medium text-white/80 group-hover:text-white">{actor.name}</span>
                      {actor.type === "solo" && (
                        <span className="text-xs text-primary/70 -mt-1">Solo Artist</span>
                      )}
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {data.users && data.users.length > 0 && (
              <section>
                <h2 className="font-heading text-base mb-4 text-white/60 uppercase tracking-widest">Akun</h2>
                <div className="space-y-2">
                  {data.users.map((u) => (
                    <Link
                      key={u.id}
                      href={`/users/${u.id}`}
                      className="flex items-center gap-3 p-3 rounded-lg glass-panel border-white/5 hover:border-primary/50 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full overflow-hidden glass-panel-strong flex items-center justify-center text-sm font-bold text-white shrink-0">
                        {u.photoUrl
                          ? <img src={u.photoUrl} className="w-full h-full object-cover" alt={u.username} />
                          : u.username.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-white/90">@{u.username}</span>
                      {u.verified && <span className="text-xs text-white/50">✓</span>}
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {(!data.dramas || data.dramas.length === 0) &&
              (!data.actors || data.actors.length === 0) &&
              (!data.users || data.users.length === 0) && (
                <div className="text-center py-16">
                  <p className="text-white/30 text-base mb-1">Tidak ada hasil untuk &ldquo;{query}&rdquo;</p>
                  <p className="text-white/20 text-sm">Coba kata kunci yang berbeda</p>
                </div>
              )}
          </div>
        )}
      </main>
    </div>
  );
}
