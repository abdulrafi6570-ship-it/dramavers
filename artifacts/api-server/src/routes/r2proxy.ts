import { Router } from "express";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getR2Client, getR2BucketName } from "../lib/r2";

const router = Router();

router.get("/*", async (req, res) => {
  const key = (req.params as any)[0];
  if (!key) { res.status(400).json({ error: "No key" }); return; }
  try {
    const client = getR2Client();
    const cmd = new GetObjectCommand({ Bucket: getR2BucketName(), Key: key });
    const obj = await client.send(cmd);
    const ct = obj.ContentType ?? "image/jpeg";
    res.setHeader("Content-Type", ct);
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    (obj.Body as any).pipe(res);
  } catch (e: any) {
    res.status(404).json({ error: "Not found" });
  }
});

export default router;
