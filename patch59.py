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

ROUTE = "artifacts/api-server/src/routes/videos.ts"

replace_once(
    ROUTE,
    '''import {
  ListVideosQueryParams, CreateVideoBody, GetVideoParams,
  UpdateVideoParams, UpdateVideoBody, DeleteVideoParams,
  RecordViewParams, DownloadVideoParams, RateVideoParams, RateVideoBody,
} from "@workspace/api-zod";''',
    '''import {
  ListVideosQueryParams, CreateVideoBody, GetVideoParams,
  UpdateVideoParams, UpdateVideoBody, DeleteVideoParams,
  RecordViewParams, DownloadVideoParams, RateVideoParams, RateVideoBody,
} from "@workspace/api-zod";
import { z } from "zod";

// Field CR (credit) belum ada di generated api-zod, divalidasi manual di sini
const CrFields = z.object({
  isOriginal: z.boolean().optional(),
  creditName: z.string().max(150).nullable().optional(),
  creditUrl: z.string().url().max(500).nullable().optional(),
});''',
    "tambah import zod + skema validasi CrFields",
)

replace_once(
    ROUTE,
    '''  const [video] = await db.insert(videosTable).values(parsed.data as any).returning();
  res.status(201).json(formatVideo(video));
});''',
    '''  const crParsed = CrFields.safeParse(req.body);
  const crData = crParsed.success ? crParsed.data : {};
  const [video] = await db.insert(videosTable).values({ ...parsed.data, ...crData } as any).returning();
  res.status(201).json(formatVideo(video));
});''',
    "POST /videos: gabungin field CR ke insert",
)

replace_once(
    ROUTE,
    '''  const [video] = await db.update(videosTable).set(parsed.data as any).where(eq(videosTable.id, params.data.id)).returning();''',
    '''  const crParsed = CrFields.safeParse(req.body);
  const crData = crParsed.success ? crParsed.data : {};
  const [video] = await db.update(videosTable).set({ ...parsed.data, ...crData } as any).where(eq(videosTable.id, params.data.id)).returning();''',
    "PATCH /videos/:id: gabungin field CR ke update",
)

replace_once(
    ROUTE,
    '''    viewCount: v.viewCount ?? 0, downloadCount: v.downloadCount ?? 0, favoriteCount: v.favoriteCount ?? 0,
    popularityScore: v.popularityScore ?? null,
    isFavorited: userId && favoriteIds ? favoriteIds.has(v.id) : null,''',
    '''    viewCount: v.viewCount ?? 0, downloadCount: v.downloadCount ?? 0, favoriteCount: v.favoriteCount ?? 0,
    popularityScore: v.popularityScore ?? null,
    isOriginal: v.isOriginal ?? true, creditName: v.creditName ?? null, creditUrl: v.creditUrl ?? null,
    isFavorited: userId && favoriteIds ? favoriteIds.has(v.id) : null,''',
    "formatVideo: tambah isOriginal/creditName/creditUrl",
)

replace_once(
    ROUTE,
    '''    viewCount: v.viewCount, downloadCount: v.downloadCount, favoriteCount: v.favoriteCount,
    popularityScore: v.popularityScore ?? null,
    averageRating: avgRow.avg ? Number(avgRow.avg) : null,''',
    '''    viewCount: v.viewCount, downloadCount: v.downloadCount, favoriteCount: v.favoriteCount,
    popularityScore: v.popularityScore ?? null,
    isOriginal: v.isOriginal ?? true, creditName: v.creditName ?? null, creditUrl: v.creditUrl ?? null,
    averageRating: avgRow.avg ? Number(avgRow.avg) : null,''',
    "GET /videos/:id: tambah isOriginal/creditName/creditUrl di response detail",
)

print("\nSelesai patch59: backend routes udah support field CR.")
