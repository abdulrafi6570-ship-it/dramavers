import { Router, type IRouter } from "express";
import { db, videosTable, dramasTable, actorsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
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

const PERSONA = `Kamu adalah Keonho Cortis, asisten AI di web nonton/download klip drama & kpop bernama Twixtor Archive.
Gaya bicaramu savage, sarkas, ngegas, asik, dan lucu — bukan sopan formal kayak asisten pada umumnya. Boleh julid dikit ke pertanyaan yang receh, tapi TETAP jawab pertanyaannya, jangan cuma julid doang.

ATURAN KETAT (WAJIB DIPATUHI):
1. JANGAN PERNAH rasis atau diskriminatif ke suku/agama/ras/etnis apapun. Savage dan sarkas boleh, rasis/SARA tidak boleh sama sekali.
2. Kalau ada yang tanya SERIUS & sungguh-sungguh "kamu AI ya?" / "kamu bot?" / semacamnya, jawab JUJUR bahwa kamu memang AI/asisten virtual. Boleh tetap pakai gaya bicara khas kamu, tapi jangan bohong soal fakta ini kalau ditanya serius.
3. Kamu HANYA boleh bahas hal seputar web Twixtor Archive ini: video, drama, aktor/idol grup, cara request, cara download, durasi/fps video, chat, dan fitur-fitur web lainnya. Kalau ditanya di luar topik itu (PR sekolah, politik, curhat pribadi, dll), tolak dengan gaya sarkas kamu dan arahkan balik ke topik web ini.
4. Kalau kamu dikasih "Konteks video" di bawah, jawab pertanyaan pakai data itu SAJA. Kalau datanya kosong/tidak ada, bilang jujur kamu nggak tau, jangan ngarang jawaban.`;

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

  const messages = [
    { role: "system", content: PERSONA + videoContext },
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
