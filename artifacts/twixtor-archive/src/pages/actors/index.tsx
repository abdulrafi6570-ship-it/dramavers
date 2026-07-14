import { useListActors } from "@workspace/api-client-react";
import { Navbar } from "@/components/layout/Navbar";
import { Link } from "wouter";
import { useState } from "react";

type ActorTab = "drama" | "solo";

export default function Actors() {
  const [tab, setTab] = useState<ActorTab>("drama");

  const { data: dramaActors, isLoading: loadingDrama } = useListActors({ type: "drama", limit: 80 });
  const { data: soloActors, isLoading: loadingSolo } = useListActors({ type: "solo", limit: 80 });

  const actors = tab === "drama" ? dramaActors?.actors : soloActors?.actors;
  const isLoading = tab === "drama" ? loadingDrama : loadingSolo;

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 md:pb-0">
      <Navbar />
      <main className="container mx-auto px-4 md:px-6 py-8">
        <h1 className="font-brand text-3xl tracking-[0.06em] text-white mb-6">
          {tab === "drama" ? "Drama Actors" : "Solo Artists"}
        </h1>

        {/* Tab switcher */}
        <div className="flex gap-2 mb-8">
          <button
            onClick={() => setTab("drama")}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-all border ${
              tab === "drama"
                ? "bg-primary/20 border-primary/60 text-primary neon-glow-purple"
                : "border-white/10 text-white/50 hover:text-white hover:border-white/30"
            }`}
          >
            Drama Actors
          </button>
          <button
            onClick={() => setTab("solo")}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-all border ${
              tab === "solo"
                ? "bg-primary/20 border-primary/60 text-primary neon-glow-purple"
                : "border-white/10 text-white/50 hover:text-white hover:border-white/30"
            }`}
          >
            Solo Artists
          </button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-8 gap-4">
            {[...Array(16)].map((_, i) => (
              <div key={i} className="aspect-square rounded-full bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : actors && actors.length > 0 ? (
          <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-8 gap-6">
            {actors.map((actor) => (
              <Link
                key={actor.id}
                href={`/actors/${actor.id}`}
                className="group flex flex-col items-center text-center gap-3"
              >
                <div className="relative w-full aspect-square rounded-full overflow-hidden glass-panel border-white/5 group-hover:border-primary/50 transition-all group-hover:neon-glow-purple duration-300">
                  {actor.photoUrl ? (
                    <img
                      src={actor.photoUrl}
                      alt={actor.name}
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-black/60 flex items-center justify-center text-white/20 text-2xl font-bold">
                      {actor.name.charAt(0)}
                    </div>
                  )}
                </div>
                <h3 className="font-medium text-sm text-white/80 group-hover:text-white transition-colors">
                  {actor.name}
                </h3>
                {(actor.videoCount ?? 0) > 0 && (
                  <p className="text-xs text-white/30 -mt-2">{actor.videoCount} clips</p>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-white/30">
            <p className="text-lg">No {tab === "drama" ? "drama actors" : "solo artists"} yet</p>
          </div>
        )}
      </main>
    </div>
  );
}
