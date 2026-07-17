import { Router, Request, Response } from "express";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Readable } from "stream";

const router = Router();

function getClient(): S3Client {
  return new S3Client({
    region: "auto",
    endpoint: `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
    },
  });
}

router.use(async (req: Request, res: Response): Promise<void> => {
  const key = req.path.replace(/^\//, "");
  if (!key) { res.status(400).json({ error: "No key" }); return; }
  try {
    const cmd = new GetObjectCommand({
      Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME!,
      Key: key,
    });
    const obj = await getClient().send(cmd);
    res.setHeader("Content-Type", obj.ContentType ?? "image/jpeg");
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    (obj.Body as Readable).pipe(res);
  } catch {
    res.status(404).json({ error: "Not found" });
  }
});

export default router;
