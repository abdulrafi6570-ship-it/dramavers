def replace_once(path, old, new, label):
    with open(path, encoding="utf-8") as f:
        content = f.read()
    count = content.count(old)
    if count != 1:
        raise SystemExit(f"[FAIL] {label}: expected 1 match, found {count} in {path}")
    content = content.replace(old, new, 1)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"[OK] {label}")

PAGE = "artifacts/twixtor-archive/src/pages/actors/[id].tsx"

replace_once(
    PAGE,
    '''import { ArrowLeft, UserPlus, UserCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

export default function ActorDetail() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: actor, isLoading } = useGetActor(id, { query: { queryKey: getGetActorQueryKey(id), enabled: !!id } });

  const [isFollowed, setIsFollowed] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    if (actor) {
      setIsFollowed(!!(actor as any).isFollowed);
      setFollowerCount((actor as any).followerCount ?? 0);
    }
  }, [actor]);

  const token = () => localStorage.getItem("twixtor_token");

  async function handleFollow() {
    if (!user) return;
    setFollowLoading(true);
    try {
      if (isFollowed) {
        const res = await fetch(`/api/follows/actors/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token()}` },
        });
        const data = await res.json();
        setIsFollowed(false);
        setFollowerCount(data.followerCount ?? Math.max(0, followerCount - 1));
      } else {
        const res = await fetch(`/api/follows/actors/${id}`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token()}` },
        });
        const data = await res.json();
        setIsFollowed(true);
        setFollowerCount(data.followerCount ?? followerCount + 1);
      }
      qc.invalidateQueries({ queryKey: getGetActorQueryKey(id) });
    } finally {
      setFollowLoading(false);
    }
  }''',
    '''import { ArrowLeft } from "lucide-react";

export default function ActorDetail() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const { data: actor, isLoading } = useGetActor(id, { query: { queryKey: getGetActorQueryKey(id), enabled: !!id } });''',
    "hapus semua state & logic follow aktor (root cause crash)",
)

replace_once(
    PAGE,
    '''              <div className="flex items-center gap-4 mb-3">
                <span className="text-white/50 text-sm">{actor.videoCount} clips</span>
                <span className="text-white/30 text-xs">·</span>
                <span className="text-white/50 text-sm">
                  <span className="text-white font-semibold">{followerCount}</span> pengikut
                </span>
              </div>

              {user && (
                <button
                  onClick={handleFollow}
                  disabled={followLoading}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold transition-all border ${
                    isFollowed
                      ? "bg-primary/20 border-primary/60 text-primary hover:bg-red-500/20 hover:border-red-400/60 hover:text-red-400"
                      : "bg-white/10 border-white/20 text-white hover:bg-primary/20 hover:border-primary/60 hover:text-primary"
                  } ${followLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {isFollowed
                    ? <><UserCheck className="h-4 w-4" />Mengikuti</>
                    : <><UserPlus className="h-4 w-4" />Ikuti</>
                  }
                </button>
              )}''',
    '''              <div className="flex items-center gap-4 mb-3">
                <span className="text-white/50 text-sm">{actor.videoCount} clips</span>
              </div>''',
    "hapus tombol Ikuti/Mengikuti dari halaman aktor",
)

print("\nSelesai patch71: fitur follow aktor bersih dihapus dari halaman aktor.")
