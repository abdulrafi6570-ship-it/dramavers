const API_BASE = "https://dramavers-production.up.railway.app";

export async function generateThumbnailFromVideoUrl(videoUrl: string): Promise<string> {
  const blob = await captureFrameAsBlob(videoUrl);
  return uploadThumbnailBlob(blob);
}

function captureFrameAsBlob(videoUrl: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.src = videoUrl;

    const cleanup = () => {
      video.src = "";
      video.remove();
    };

    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error("Timeout loading video for thumbnail capture"));
    }, 15000);

    video.addEventListener("loadedmetadata", () => {
      const seekTo = Math.min(1, (video.duration || 2) * 0.1);
      video.currentTime = seekTo;
    });

    video.addEventListener("seeked", () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Canvas context unavailable");
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => {
            clearTimeout(timeout);
            cleanup();
            if (blob) resolve(blob);
            else reject(new Error("Failed to encode captured frame"));
          },
          "image/jpeg",
          0.85
        );
      } catch (err) {
        clearTimeout(timeout);
        cleanup();
        reject(err);
      }
    });

    video.addEventListener("error", () => {
      clearTimeout(timeout);
      cleanup();
      reject(new Error("Failed to load video for thumbnail capture"));
    });
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
