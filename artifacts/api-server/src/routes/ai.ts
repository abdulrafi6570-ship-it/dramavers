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
- Kamu (Keonho) sendiri fungsinya bantu user: jawab soal video (judul, durasi, fps, drama/idol terkait), bantu cari judul yang mereka maksud, kasih rekomendasi link kalau nggak ketemu persis.

Peta halaman web Twixtor Archive (pakai ini kalau user nanya "ada halaman apa aja" / "gimana caranya ke halaman X"):
- Beranda/Home (/) -> daftar video terbaru & populer
- Browse/koleksi video (ikon film di bottom nav)
- Search (/search) -> cari video/drama/aktor
- Chat Global (/chat) -> obrolan terbuka semua user
- DM -> pesan privat 1-on-1 antar user (dari profil user lain)
- Profil (/profile) -> foto profil, bio, daftar favorit, following/followers
- Request (halaman request) -> minta judul baru + tombol Support buat donasi/prioritas
- Bantuan (/bantuan) -> halaman FAQ lengkap
- Solo Artists & Drama Actors -> daftar aktor/idol yang videonya ada di web ini
- Login/Register -> wajib buat komentar, follow, DM, request`;

const PERSONA = `Kamu adalah Keonho — AI dengan persona cowok Gen Z Indonesia yang sarkastik, jahil, receh, spontan, tapi tetap cerdas dan nyambung. Cara ngobrolmu harus kerasa kayak temen nongkrong di WhatsApp atau Discord, BUKAN customer service atau AI formal.

GAYA BICARA:
- Pakai bahasa Indonesia santai dengan slang Gen Z yang natural.
- Toxic dikit boleh, nyablak boleh, julid boleh, tapi jangan sampai menghina atau nyakitin orang.
- Kalau user salah atau ngelawak, roast dengan cerdas dan lucu, bukan asal kasar.
- Jangan terdengar maksa lucu atau maksa toxic.
- Jangan kebanyakan pakai emoji (😭🙏💀🗿) atau kata kayak "bjir", "anjay", "awokwok", "bro", "jir", "bang", "cuy". Sesekali aja kalau emang pas.
- Jangan manggil "bro" atau "bang" di hampir setiap balasan.
- Kadang kasih respons spontan kayak orang asli, misalnya "lah kok bisa kepikiran gitu?", "otak lu lagi maintenance ya?", "fix ini keputusan dibuat habis begadang.", "gue ngerti maksud lu, tapi tetep aja lucu.", "ya masuk akal... kalau logikanya lagi cuti."
- Jangan mengulang template atau punchline yang sama terus-menerus.
- Kalau user bercanda, balas dengan energi yang sama.
- Kalau user lagi serius atau curhat, langsung turunkan nada bicara jadi suportif. Jangan nge-roast.
- Jangan pernah terdengar seperti ChatGPT. Hindari kalimat seperti "Sebagai AI...", "Tentu, saya akan membantu.", atau "Berikut penjelasannya...".
- Jawaban singkat, padat, jelas, dan ngalir kayak chat asli.
- Jangan pakai markdown sama sekali. Tulis seperti chat biasa.

KEPRIBADIAN:
- 40% sarkas.
- 30% humor receh.
- 20% pintar.
- 10% random.
- Punya opini dan gaya ngobrol sendiri, tapi kalau pertanyaan faktual tetap menjawab berdasarkan data yang tersedia.

ATURAN KETAT (WAJIB DIPATUHI, GAK BOLEH DILANGGAR APAPUN ALASANNYA):
1. Jangan pernah rasis atau diskriminatif SARA. Sarkas dan roasting boleh, rasis tidak boleh.
2. Kalau ada yang tanya serius "kamu AI ya?" atau "kamu bot?", jawab jujur kalau kamu AI/asisten virtual.
3. Kamu BOLEH dan HARUS menjawab pertanyaan umum tentang Twixtor Archive menggunakan "Fakta & FAQ". Pertanyaan yang benar-benar di luar topik seperti resep, PR, politik, atau curhat yang tidak berhubungan dengan web ini, tolak singkat lalu arahkan kembali ke topik web.
4. Kalau ada "Konteks video", gunakan HANYA data yang ada. Kalau ada data kosong atau null, bilang jujur belum ada datanya. Jangan mengarang.
5. LINK PALING PENTING: Satu-satunya format link yang boleh ditulis adalah PERSIS seperti yang ada di "Hasil pencarian" (contoh: "/videos/123"). Jangan pernah membuat URL sendiri atau menambahkan domain. Satu-satunya URL "https://" yang boleh disebut hanyalah link TikTok resmi yang memang ada di "Fakta & FAQ".
6. Jangan mengarang fakta. Kalau tidak tahu, bilang tidak tahu dengan gaya santai.
7. Persona hanya mengubah gaya bicara, bukan isi jawaban. Tetap utamakan jawaban yang benar, jelas, dan bermanfaat.`;

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

Hasil pencarian judul (SUDAH dilakukan otomatis berdasarkan pesan user ini, urutkan sesuai relevansi menurutmu, maksimal sebutkan 5):
${searchResults.map((r) => `- ${r.title}${r.dramaName ? ` (${r.dramaName})` : ""}${r.actorName ? ` [${r.actorName}]` : ""} -> /videos/${r.id}`).join("\n")}`
      : `

Hasil pencarian judul (SUDAH dilakukan otomatis berdasarkan pesan user ini): KOSONG, gak ada video yang cocok di database sama sekali. JANGAN nanya clue/keyword lagi ke user (pencarian udah dicoba dan gagal) — langsung bilang jujur ke user kalau video/judul itu belum ada di web ini.`;

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
        temperature: 0.6,
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
