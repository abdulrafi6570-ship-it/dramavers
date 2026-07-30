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

HOME_PATH = "artifacts/api-server/src/routes/home.ts"
SEARCH_PATH = "artifacts/twixtor-archive/src/pages/search/index.tsx"

replace_once(
    HOME_PATH,
    """  const [dramas, actors, users] = await Promise.all([
    db.select().from(dramasTable).where(ilike(dramasTable.name, `%${q}%`)).limit(8),
    db.select().from(actorsTable).where(ilike(actorsTable.name, `%${q}%`)).limit(8),
    db.select().from(usersTable).where(ilike(usersTable.username, `%${q}%`)).limit(8),
  ]);""",
    """  const [dramas, actors, users, videos] = await Promise.all([
    db.select().from(dramasTable).where(ilike(dramasTable.name, `%${q}%`)).limit(8),
    db.select().from(actorsTable).where(ilike(actorsTable.name, `%${q}%`)).limit(8),
    db.select().from(usersTable).where(ilike(usersTable.username, `%${q}%`)).limit(8),
    db.select({ video: videosTable, dramaName: dramasTable.name, actorName: actorsTable.name })
      .from(videosTable)
      .leftJoin(dramasTable, eq(videosTable.dramaId, dramasTable.id))
      .leftJoin(actorsTable, eq(videosTable.actorId, actorsTable.id))
      .where(and(eq(videosTable.status, "published"), ilike(videosTable.title, `%${q}%`)))
      .limit(12),
  ]);""",
    "Actually query the videos table in /api/search",
)

replace_once(
    HOME_PATH,
    """    users: users.map((u) => ({
      id: u.id, username: u.username, photoUrl: u.photoUrl ?? null, verified: u.verified,
    })),
    videos: [],
  });
});""",
    """    users: users.map((u) => ({
      id: u.id, username: u.username, photoUrl: u.photoUrl ?? null, verified: u.verified,
    })),
    videos: videos.map((r) => formatVideo({ ...r.video, dramaName: r.dramaName, actorName: r.actorName })),
  });
});""",
    "Return real matched videos instead of an always-empty array",
)

replace_once(
    SEARCH_PATH,
    """import GlowingSearchBar from "@/components/ui/animated-glowing-search-bar";
import { Link } from "wouter";""",
    """import GlowingSearchBar from "@/components/ui/animated-glowing-search-bar";
import { Link } from "wouter";
import { VideoCard } from "@/components/video/VideoCard";""",
    "Import VideoCard into Search page",
)

replace_once(
    SEARCH_PATH,
    """            {data.actors && data.actors.length > 0 && (""",
    """            {data.videos && data.videos.length > 0 && (
              <section>
                <h2 className="font-heading text-base mb-4 text-white/60 uppercase tracking-widest">Video</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {data.videos.map((video) => (
                    <VideoCard key={video.id} video={video} />
                  ))}
                </div>
              </section>
            )}

            {data.actors && data.actors.length > 0 && (""",
    "Render matched videos in their own section on the Search page",
)

replace_once(
    SEARCH_PATH,
    """            {(!data.dramas || data.dramas.length === 0) &&
              (!data.actors || data.actors.length === 0) &&
              (!data.users || data.users.length === 0) && (""",
    """            {(!data.dramas || data.dramas.length === 0) &&
              (!data.actors || data.actors.length === 0) &&
              (!data.users || data.users.length === 0) &&
              (!data.videos || data.videos.length === 0) && (""",
    "Include videos in the 'no results at all' empty-state check",
)

print("\nAll patches applied successfully.")
