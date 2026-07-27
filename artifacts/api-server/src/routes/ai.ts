import { Router, type IRouter } from "express";
import { db, videosTable, dramasTable, actorsTable } from "@workspace/db";
import { eq, ilike, or, desc } from "drizzle-orm";
import { optionalAuth } from "../middlewares/auth";
import { z } from "zod";

const router: IRouter = Router();

const ChatBody = z.object({
  message: z.string().min(1).max(1000),
  videoId: z.coerce.number().int().positive().optional(),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      }),
    )
    .max(10)
    .optional(),
});

const TIKTOK_USERNAME = "@rapzzelitcees1";
const TIKTOK_URL = "https://www.tiktok.com/@rapzzelitcees1";

const SITE_FAQ = `Fakta & FAQ resmi soal web Twixtor Archive (pakai ini buat jawab pertanyaan umum soal web, TIDAK cuma soal video yang lagi ditonton):
- Video di web ini sebagian buatan sendiri (edit slomo dll), sebagian lagi hasil clip/repost dari sumber lain (ditandai CR = credit ke pembuat aslinya di deskripsi video).
- Cara download: buka halaman video, tekan tombol Download. User bakal diminta kode akses dulu.
- Kode akses buat download didapat dari akun TikTok resmi web ini: ${TIKTOK_USERNAME} (${TIKTOK_URL}). User follow/tonton TikTok itu buat dapetin kodenya.
- Cara request judul yang belum ada: buka halaman Request, isi judul yang diminta. Kalau mau diproses cepat, klik tombol Support terus kirim dukungan berapa aja. Kalau nggak, tetap masuk antrean, diproses manual sama admin.
- Chat Global = ruang obrolan terbuka, semua user bisa lihat & ikut. DM = obrolan privat cuma kamu & satu user lain, gak kelihatan user lain.
- Kamu (Keonho) sendiri fungsinya bantu user: jawab soal video (judul, durasi, fps, drama/idol terkait), bantu cari judul yang mereka maksud, kasih rekomendasi link kalau nggak ketemu persis.`;

const PERSONA = `Kamu adalah Keonho Cortis. Kamu BUKAN asisten formal — kamu ngobrol kayak temen sendiri, sesama Gen Z, bukan customer service.

GAYA BICARA:
- Toxic tapi asik: nyablak, julid, suka nge-roast, kadang nyeletuk pedes — tapi TETAP jawab pertanyaannya, jangan cuma julid doang tanpa isi.
- Pakai bahasa gaul Gen Z Indonesia yang natural (anjir, buset, wkwk, yaudah, cringe, spill, dsb) — BUKAN bahasa baku/formal kayak surat resmi.
- JANGAN kebanyakan manggil "bro"/"bro!" di hampir tiap kalimat, itu kedengeran alay & maksa. Sesekali aja kalau emang pas.
- Jawaban SINGKAT, langsung ke poin. Jangan ceramah panjang lebar kayak robot corporate atau nulis paragraf berkhotbah.

ATURAN KETAT (WAJIB DIPATUHI, GAK BOLEH DILANGGAR):
1. JANGAN PERNAH rasis atau diskriminatif SARA (suku/agama/ras/etnis). Toxic & roasting boleh, rasis TIDAK BOLEH sama sekali.
2. Kalau ada yang tanya SERIUS & sungguh-sungguh "kamu AI ya?" / "kamu bot?", jawab JUJUR kamu emang AI/asisten virtual. Boleh tetap gaya bicara toxic kamu, tapi jangan bohong soal fakta ini.
3. Kamu BOLEH dan HARUS jawab pertanyaan UMUM soal web Twixtor Archive (pakai "Fakta & FAQ" di bawah), walaupun gak nyambung sama video yang lagi ditonton user sekarang — itu SEMUA masih termasuk topik yang boleh, BUKAN di luar topik. Yang beneran di luar topik itu kayak resep masakan, PR sekolah, politik, curhat pribadi, dll — itu baru ditolak singkat dengan gaya toxic kamu, terus arahin balik ke topik web ini.
4. Kalau ada "Konteks video" di bawah, jawab pakai data itu SAJA soal video itu. Kalau datanya kosong/gak ada, bilang jujur nggak tau dalam 1-2 kalimat aja — jangan ngarang.
5. Kalau user nyari/nanya judul tertentu, dan ada "Hasil pencarian" di bawah, kasih rekomendasi pakai daftar itu SAJA (sertakan link-nya persis, jangan diubah formatnya). Kalau ada yang cocok banget sama yang dicari, sebut itu aja. Kalau gak ada yang cocok persis, kasih maksimal 5 link paling mendekati dari daftar itu. Kalau daftar hasil pencarian kosong, bilang jujur gak nemu, jangan ngarang judul/link yang gak ada di daftar.`;

const STOPWORDS = new Set([
  "cari", "carikan", "cariin", "carii", "dong", "donk", "ya", "yah", "nih", "deh", "sih",
  "apa", "apaan", "ada", "adakah", "judul", "judulnya", "drama", "video", "link", "linknya",
  "nya", "yang", "ini", "itu", "tolong", "bantu", "mau", "nonton", "download", "downloadnya",
  "gimana", "bagaimana", "dimana", "di", "mana", "gak", "ga", "enggak", "tidak", "untuk",
  "buat", "dari", "dengan", "dan", "atau", "ke", "pada", "aku", "saya", "kamu", "gue", "gw",
  "lu", "min", "admin", "tau", "tahu", "kah", "kalo", "kalau", "film", "series", "kpop",
  "grup", "grupnya", "namanya", "nama",
]);

function extractKeywords(message: string): string[] {
  return Array.from(
    new Set(
      message
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, " ")
        .split(/\s+/)
        .filter((w) => w.length >= 3 && !STOPWORDS.has(w)),
    ),
  );
}

async function searchTitles(message: string) {
  const keywords = extractKeywords(message);
  if (keywords.length === 0) return [];

  const conditions = keywords.flatMap((kw) => [
    ilike(videosTable.title, `%${kw}%`),
    ilike(dramasTable.name, `%${kw}%`),
    ilike(actorsTable.name, `%${kw}%`),
  ]);

  const rows = await db
    .select({
      id: videosTable.id,
      title: videosTable.title,
      dramaName: dramasTable.name,
      actorName: actorsTable.name,
    })
    .from(videosTable)
    .leftJoin(dramasTable, eq(videosTable.dramaId, dramasTable.id))
    .leftJoin(actorsTable, eq(videosTable.actorId, actorsTable.id))
    .where(or(...conditions))
    .orderBy(desc(videosTable.popularityScore))
    .limit(8);

  return rows;
}

router.post("/ai/chat", optionalAuth, async (req, res): Promise<void> => {
  const parsed = ChatBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { message, videoId, history } = parsed.data;

  if (!process.env.GROQ_API_KEY) {
    res.status(500).json({ error: "AI belum dikonfigurasi di server" });
    return;
  }

  let videoContext = "";
  if (videoId) {
    const [row] = await db
      .select({ video: videosTable, drama: dramasTable, actor: actorsTable })
      .from(videosTable)
      .leftJoin(dramasTable, eq(videosTable.dramaId, dramasTable.id))
      .leftJoin(actorsTable, eq(videosTable.actorId, actorsTable.id))
      .where(eq(videosTable.id, videoId));

    if (row) {
      const v = row.video;
      const d = row.drama;
      const a = row.actor;
      videoContext = `

Konteks video yang sedang ditonton user:
- Judul video: ${v.title}
- Drama/Series: ${d?.name ?? "tidak ada"}
- Kategori: ${d?.category ?? "tidak diketahui"} (kdrama=Korea, cdrama=China, indo=Indonesia, film_barat=Barat, anime=Jepang, series=lainnya)
- Genre: ${d?.genre ?? "tidak ada"}
- Deskripsi drama: ${d?.description ?? "tidak ada"}
- Aktor/idol terkait: ${a?.name ?? "tidak ada"} (tipe: ${a?.type ?? "-"})
- Bio aktor/idol (biasanya berisi nama grup/agensi kalau ada): ${a?.bio ?? "tidak ada"}
- Episode: ${v.episode ?? "-"} | Scene: ${v.scene ?? "-"}
- Resolusi: ${v.resolution ?? "-"} | FPS: ${v.fps ?? "-"} | Durasi: ${v.duration ?? "-"} detik
- Tags: ${(v.tags ?? []).join(", ") || "-"}`;
    }
  }

  const searchResults = await searchTitles(message);
  const searchContext =
    searchResults.length > 0
      ? `

Hasil pencarian judul (berdasarkan pesan user, urutkan sesuai relevansi menurutmu, maksimal sebutkan 5):
${searchResults.map((r) => `- ${r.title}${r.dramaName ? ` (${r.dramaName})` : ""}${r.actorName ? ` [${r.actorName}]` : ""} -> /videos/${r.id}`).join("\n")}`
      : "";

  const messages = [
    { role: "system", content: PERSONA + "\n\n" + SITE_FAQ + videoContext + searchContext },
    ...(history ?? []),
    { role: "user", content: message },
  ];

  try {
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages,
        temperature: 0.8,
        max_tokens: 500,
      }),
    });

    if (!groqRes.ok) {
      const text = await groqRes.text();
      req.log.error({ status: groqRes.status, text }, "Groq API error");
      res.status(502).json({ error: "Keonho lagi sibuk, coba lagi bentar." });
      return;
    }

    const data: any = await groqRes.json();
    const answer = data.choices?.[0]?.message?.content ?? "Maaf, gagal generate jawaban.";
    res.json({ answer });
  } catch (err) {
    req.log.error({ err }, "AI chat request failed");
    res.status(502).json({ error: "Keonho lagi sibuk, coba lagi bentar." });
  }
});

export default router;
