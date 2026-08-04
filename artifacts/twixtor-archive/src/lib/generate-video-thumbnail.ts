const API_BASE = "https://dramavers-production.up.railway.app";

export async function generateThumbnailFromVideoUrl(videoUrl: string): Promise<string> {
  try {
    const blob = await captureFrameAsBlob(videoUrl);
    return await uploadThumbnailBlob(blob);
  } catch (firstErr) {
    await new Promise((r) => setTimeout(r, 1500));
    const blob = await captureFrameAsBlob(videoUrl);
    return await uploadThumbnailBlob(blob);
  }
}

function captureFrameAsBlob(videoUrl: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";

    let settled = false;
    let seekAttempted = false;

    const cleanup = () => {
      video.removeAttribute("src");
      video.load();
      video.remove();
    };

    const finish = (result: { ok: true; blob: Blob } | { ok: false; err: Error }) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      cleanup();
      if (result.ok) resolve(result.blob);
      else reject(result.err);
    };

    const timeout = setTimeout(() => {
      finish({ ok: false, err: new Error("Timeout loading video for thumbnail capture") });
    }, 30000);

    const attemptSeek = () => {
      if (seekAttempted) return;
      if (!video.duration || Number.isNaN(video.duration) || !Number.isFinite(video.duration)) return;
      seekAttempted = true;
      const seekTo = Math.min(1, video.duration * 0.1);
      video.currentTime = seekTo;
    };

    const captureFrame = () => {
      requestAnimationFrame(() => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = video.videoWidth || 640;
          canvas.height = video.videoHeight || 360;
          const ctx = canvas.getContext("2d");
          if (!ctx) throw new Error("Canvas context unavailable");
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          canvas.toBlob(
            (blob) => {
              if (blob) finish({ ok: true, blob });
              else finish({ ok: false, err: new Error("Failed to encode captured frame") });
            },
            "image/jpeg",
            0.85
          );
        } catch (err) {
          finish({ ok: false, err: err instanceof Error ? err : new Error(String(err)) });
        }
      });
    };

    video.addEventListener("loadedmetadata", attemptSeek);
    video.addEventListener("loadeddata", attemptSeek);
    video.addEventListener("seeked", captureFrame);
    video.addEventListener("error", () => {
      finish({ ok: false, err: new Error("Failed to load video for thumbnail capture") });
    });

    video.src = videoUrl;
    video.load();
  });
}

function uploadThumbnailBlob(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const token = localStorage.getItem("twixtor_token");
    const formData = new FormData();
    formData.append("file", blob, "auto-thumbnail.jpg");

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_BASE}/api/uploads`);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          resolve(data.url);
        } catch {
          reject(new Error("Invalid upload response"));
        }
      } else {
        reject(new Error("Upload thumbnail gagal: " + xhr.status));
      }
    };
    xhr.onerror = () => reject(new Error("Koneksi gagal saat upload thumbnail"));
    xhr.send(formData);
  });
}
