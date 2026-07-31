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

DRAMA_PATH = "artifacts/twixtor-archive/src/pages/dramas/[id].tsx"

replace_once(
    DRAMA_PATH,
    """import { useGetDrama, getGetDramaQueryKey } from "@workspace/api-client-react";
import { Navbar } from "@/components/layout/Navbar";
import { VideoCard } from "@/components/video/VideoCard";
import { Link, useParams } from "wouter";
import { ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";""",
    """import { useGetDrama, getGetDramaQueryKey } from "@workspace/api-client-react";
import { Navbar } from "@/components/layout/Navbar";
import { VideoCard } from "@/components/video/VideoCard";
import { Link, useParams } from "wouter";
import { ArrowLeft, Heart, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

const API_BASE = "https://dramavers-production.up.railway.app";

async function toggleDramaFavorite(dramaId: number, isFavorited: boolean) {
  const token = localStorage.getItem("twixtor_token");
  const res = await fetch(`${API_BASE}/api/drama-favorites/${dramaId}`, {
    method: isFavorited ? "DELETE" : "POST",
    headers: { authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Gagal update favorite");
}""",
    "Add imports + toggleDramaFavorite helper to drama detail page",
)

replace_once(
    DRAMA_PATH,
    """export default function DramaDetail() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const { data: drama, isLoading } = useGetDrama(id, { query: { queryKey: getGetDramaQueryKey(id), enabled: !!id } });""",
    """export default function DramaDetail() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const { data: drama, isLoading } = useGetDrama(id, { query: { queryKey: getGetDramaQueryKey(id), enabled: !!id } });
  const queryClient = useQueryClient();
  const [favBusy, setFavBusy] = useState(false);
  const [favOverride, setFavOverride] = useState<boolean | null>(null);""",
    "Add favorite-toggle state to DramaDetail component",
)

replace_once(
    DRAMA_PATH,
    """  const actors = (drama.actors ?? []) as Actor[];
  const dramaVideos = (drama.videos ?? []) as Video[];""",
    """  const actors = (drama.actors ?? []) as Actor[];
  const dramaVideos = (drama.videos ?? []) as Video[];
  const isFavorited = favOverride ?? ((drama as any).isFavorited ?? false);

  const handleToggleFavorite = async () => {
    if (favBusy) return;
    setFavBusy(true);
    const next = !isFavorited;
    setFavOverride(next);
    try {
      await toggleDramaFavorite(id, isFavorited);
      queryClient.invalidateQueries({ queryKey: getGetDramaQueryKey(id) });
    } catch {
      setFavOverride(!next);
    } finally {
      setFavBusy(false);
    }
  };""",
    "Add isFavorited derivation + toggle handler",
)

replace_once(
    DRAMA_PATH,
    '''              <h1 className="font-heading text-2xl md:text-4xl text-white mb-3">{drama.name}</h1>''',
    '''              <div className="flex items-center gap-3 mb-3">
                <h1 className="font-heading text-2xl md:text-4xl text-white">{drama.name}</h1>
                <button
                  type="button"
                  onClick={handleToggleFavorite}
                  disabled={favBusy}
                  aria-label={isFavorited ? "Hapus dari favorit" : "Tambah ke favorit"}
                  className="flex-shrink-0 h-9 w-9 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center transition-colors disabled:opacity-50"
                >
                  {favBusy ? (
                    <Loader2 className="h-4 w-4 text-white/60 animate-spin" />
                  ) : (
                    <Heart className={`h-4 w-4 transition-colors ${isFavorited ? "fill-red-400 text-red-400" : "text-white/60"}`} />
                  )}
                </button>
              </div>''',
    "Render favorite heart button next to drama title",
)

print("\nAll patches applied successfully.")
