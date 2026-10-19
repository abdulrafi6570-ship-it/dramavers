import re

def replace_once(path, old, new, label):
    with open(path, encoding="utf-8") as f:
        content = f.read()
    count = content.count(old)
    if count != 1:
        raise SystemExit(f"[FAIL] {label}: expected 1 match in {path}, found {count}")
    content = content.replace(old, new, 1)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"[OK] {label}")

AUTH = "artifacts/api-server/src/routes/auth.ts"
PROFILE = "artifacts/twixtor-archive/src/pages/profile/index.tsx"
BGM = "artifacts/twixtor-archive/src/components/BgmPlayer.tsx"

# ---------- 1. Fix upload foto profil (auth.ts): pindah dari disk lokal ke R2 ----------
replace_once(
    AUTH,
    '''import { Router, type IRouter } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { randomUUID } from "crypto";
import { db, usersTable, accessCodesTable, userFollowsTable } from "@workspace/db";
import { eq, and, or, gt, count } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { RegisterBody, LoginBody, VerifyAccessCodeBody } from "@workspace/api-zod";
import { z } from "zod";
import { supabaseAdmin, supabaseAnon } from "../lib/supabase";

const router: IRouter = Router();

const UPLOADS_DIR = path.resolve(process.cwd(), "../../uploads");
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const avatarStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, _file, cb) => cb(null, `avatar_${randomUUID()}.jpg`),
});
const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files allowed"));
  },
});''',
    '''import { Router, type IRouter } from "express";
import multer from "multer";
import { randomUUID } from "crypto";
import { db, usersTable, accessCodesTable, userFollowsTable } from "@workspace/db";
import { eq, and, or, gt, count } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { RegisterBody, LoginBody, VerifyAccessCodeBody } from "@workspace/api-zod";
import { z } from "zod";
import { supabaseAdmin, supabaseAnon } from "../lib/supabase";
import { assertR2Configured, uploadToR2, buildR2Key } from "../lib/r2";

const router: IRouter = Router();

const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files allowed"));
  },
});''',
    "auth.ts: import & multer config -> R2",
)

replace_once(
    AUTH,
    '''router.post("/auth/upload-photo", requireAuth, avatarUpload.single("photo"), async (req, res): Promise<void> => {
  if (!req.file) { res.status(400).json({ error: "No file uploaded" }); return; }
  const photoUrl = `/api/uploads/${req.file.filename}`;
  await db.update(usersTable).set({ photoUrl }).where(eq(usersTable.id, req.user!.id));
  const userWithCounts = await getUserWithCounts(req.user!.id);
  res.json({ photoUrl, user: userWithCounts });
});''',
    '''router.post("/auth/upload-photo", requireAuth, avatarUpload.single("photo"), async (req, res): Promise<void> => {
  if (!req.file) { res.status(400).json({ error: "No file uploaded" }); return; }
  try {
    assertR2Configured();
  } catch (err: any) {
    res.status(503).json({ error: `Storage not configured: ${err.message}` });
    return;
  }
  let photoUrl: string;
  try {
    const r2Key = buildR2Key("images", `avatar_${randomUUID()}.jpg`);
    photoUrl = await uploadToR2(r2Key, req.file.buffer, req.file.mimetype);
  } catch (err: any) {
    req.log.error({ err }, "[UploadPhoto] R2 upload failed");
    res.status(502).json({ error: "Upload foto ke storage gagal" });
    return;
  }
  await db.update(usersTable).set({ photoUrl }).where(eq(usersTable.id, req.user!.id));
  const userWithCounts = await getUserWithCounts(req.user!.id);
  res.json({ photoUrl, user: userWithCounts });
});''',
    "auth.ts: route upload-photo -> pakai R2",
)

# ---------- 2. Tim jadi solo, cuma RAPP ----------
replace_once(
    PROFILE,
    '''const TEAM_PROFILES = [
  {
    name: "Soo Hyun",
    title: "Drama Editor",
    handle: "soohyun",
    avatarUrl: "/avatars/avatar1_nobg.png",
    status: "Online",
    innerGradient: "linear-gradient(145deg, rgba(8,8,18,0.96) 0%, rgba(15,15,30,0.90) 100%)",
    behindGlowColor: "rgba(200, 220, 255, 0.25)",
  },
  {
    name: "Ji Yeon",
    title: "Content Curator",
    handle: "jiyeon",
    avatarUrl: "/avatars/avatar2_nobg.png",
    status: "Online",
    innerGradient: "linear-gradient(145deg, rgba(8,8,18,0.96) 0%, rgba(12,12,24,0.92) 100%)",
    behindGlowColor: "rgba(220, 200, 255, 0.25)",
  },
  {
    name: "Kang Min",
    title: "Clip Uploader",
    handle: "kangmin",
    avatarUrl: "/avatars/avatar3_nobg.png",
    status: "Offline",
    innerGradient: "linear-gradient(145deg, rgba(6,6,16,0.97) 0%, rgba(14,14,28,0.90) 100%)",
    behindGlowColor: "rgba(180, 200, 255, 0.2)",
  },
  {
    name: "Yoo Joon",
    title: "Archive Manager",
    handle: "yoojoon",
    avatarUrl: "/avatars/avatar4_nobg.png",
    status: "Online",
    innerGradient: "linear-gradient(145deg, rgba(8,8,18,0.96) 0%, rgba(16,16,30,0.88) 100%)",
    behindGlowColor: "rgba(200, 210, 255, 0.22)",
  },
];''',
    '''const TEAM_PROFILES = [
  {
    name: "RAPP",
    title: "Archive Manager",
    handle: "rapp",
    avatarUrl: "/avatars/avatar4_nobg.png",
    status: "Online",
    innerGradient: "linear-gradient(145deg, rgba(8,8,18,0.96) 0%, rgba(16,16,30,0.88) 100%)",
    behindGlowColor: "rgba(200, 210, 255, 0.22)",
  },
];''',
    "profile/index.tsx: TEAM_PROFILES -> solo RAPP",
)

replace_once(
    PROFILE,
    '''          <h2 className="font-heading text-lg text-white/80 tracking-widest uppercase text-center mb-2">
            Tim
          </h2>''',
    '''          <h2 className="font-heading text-lg text-white/80 tracking-widest uppercase text-center mb-2">
            Pembuat
          </h2>''',
    "profile/index.tsx: heading Tim -> Pembuat",
)

replace_once(
    PROFILE,
    '              text="Para pengelola Twixtor Archive — drama clips slow motion edits curated with love"',
    '              text="Pengelola Twixtor Archive — drama clips slow motion edits curated with love"',
    "profile/index.tsx: teks FallingText singular",
)

# ---------- 3. BgmPlayer simpel, gampang on/off, gak nutupin nav ----------
NEW_BGM = '''import { useEffect, useRef, useState } from "react";
import { Music2, VolumeX } from "lucide-react";

interface BgmPlayerProps {
  src: string;
}

export function BgmPlayer({ src }: BgmPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!audioRef.current || !src) return;
    const audio = audioRef.current;
    audio.volume = 0.3;
    audio.loop = true;

    const tryPlay = () => {
      audio
        .play()
        .then(() => setPlaying(true))
        .catch(() => {});
    };
    tryPlay();
    document.addEventListener("click", tryPlay, { once: true });
    return () => document.removeEventListener("click", tryPlay);
  }, [src]);

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setPlaying(true))
        .catch(() => {});
    }
  };

  if (!src) return null;

  return (
    <>
      <audio ref={audioRef} src={src} preload="none" />
      <button
        onClick={toggle}
        className="fixed bottom-24 right-4 z-[500] w-11 h-11 rounded-full glass-panel-strong border border-white/10 flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all shadow-lg"
        title={playing ? "Matikan musik" : "Nyalakan musik"}
      >
        {playing ? (
          <Music2 className="w-5 h-5 text-white/80" />
        ) : (
          <VolumeX className="w-5 h-5 text-white/40" />
        )}
      </button>
    </>
  );
}
'''
with open(BGM, "w", encoding="utf-8") as f:
    f.write(NEW_BGM)
print("[OK] BgmPlayer.tsx: disederhanakan jadi 1 tombol on/off, pindah ke atas nav bar")

print("\nSelesai semua patch.")
