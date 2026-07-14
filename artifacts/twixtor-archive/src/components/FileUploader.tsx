import { useRef, useState } from "react";
import { Upload, X, Loader2, Music } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FileUploaderProps {
  accept?: string;
  label?: string;
  onUpload: (url: string) => void;
  currentUrl?: string;
  previewType?: "image" | "video" | "audio" | "auto";
  thumbnailMode?: boolean;
  toMp3?: boolean;
}

export function FileUploader({
  accept = "image/*,video/*,audio/*",
  label = "Upload File",
  onUpload,
  currentUrl = "",
  previewType = "auto",
  thumbnailMode = false,
  toMp3 = false,
}: FileUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentUrl);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);

  const getType = (url: string, file?: File): "image" | "video" | "audio" => {
    if (previewType !== "auto") return previewType;
    if (file) {
      if (file.type.startsWith("video/")) return toMp3 ? "audio" : "video";
      if (file.type.startsWith("audio/")) return "audio";
      if (file.type.startsWith("image/")) return "image";
    }
    if (/\.(mp4|webm|mov|avi|mkv)(\?|$)/i.test(url)) return "video";
    if (/\.(mp3|wav|ogg|m4a|aac|flac)(\?|$)/i.test(url)) return "audio";
    return "image";
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    setProgress(0);

    try {
      const token = localStorage.getItem("twixtor_token");
      const endpoint = toMp3 ? "/api/uploads/mp3" : "/api/uploads";

      const formData = new FormData();
      formData.append("file", file);

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", endpoint);
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        xhr.upload.onprogress = (evt) => {
          if (evt.lengthComputable) setProgress(Math.round((evt.loaded / evt.total) * 100));
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const data = JSON.parse(xhr.responseText);
            const url = data.url;
            setPreview(url);
            setProgress(100);
            onUpload(url);
            resolve();
          } else {
            reject(new Error("Upload gagal: " + xhr.status));
          }
        };
        xhr.onerror = () => reject(new Error("Koneksi gagal"));
        xhr.send(formData);
      });
    } catch (err: any) {
      setError(err?.message ?? "Upload gagal. Coba lagi.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const clear = () => {
    setPreview("");
    setProgress(0);
    setError("");
    onUpload("");
  };

  const mediaType = preview ? getType(preview) : null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="border-white/20 text-white hover:bg-white/10 text-xs"
        >
          {uploading ? (
            <><Loader2 className="h-3 w-3 mr-1.5 animate-spin" />{toMp3 ? "Konversi" : "Upload"} {progress > 0 ? `${progress}%` : "..."}</>
          ) : (
            <>{toMp3 ? <Music className="h-3 w-3 mr-1.5" /> : <Upload className="h-3 w-3 mr-1.5" />}{label}</>
          )}
        </Button>
        {preview && (
          <Button type="button" variant="ghost" size="sm" onClick={clear} className="text-red-400 hover:text-red-300 text-xs">
            <X className="h-3 w-3 mr-1" />Hapus
          </Button>
        )}
      </div>

      {uploading && progress > 0 && progress < 100 && (
        <div className="w-full bg-white/10 rounded-full h-1.5">
          <div className="bg-white h-1.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      )}

      {toMp3 && uploading && progress === 100 && (
        <p className="text-xs text-white/50 flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" />Mengkonversi ke MP3...</p>
      )}

      {error && <p className="text-xs text-red-400">{error}</p>}

      {preview && (
        <div className={`rounded-xl overflow-hidden border border-white/10 bg-black/40 ${thumbnailMode ? "w-28" : "max-w-xs"}`}>
          {mediaType === "video" && (
            thumbnailMode ? (
              <div className="aspect-[9/16]">
                <video src={preview} className="w-full h-full object-cover" muted playsInline />
              </div>
            ) : (
              <video src={preview} className="w-full max-h-36 object-cover" muted controls playsInline />
            )
          )}
          {mediaType === "audio" && (
            <div className="p-3">
              <audio src={preview} controls className="w-full" />
            </div>
          )}
          {mediaType === "image" && (
            thumbnailMode ? (
              <div className="aspect-[9/16]">
                <img src={preview} alt="preview" className="w-full h-full object-cover" />
              </div>
            ) : (
              <img src={preview} alt="preview" className="w-full max-h-36 object-cover" />
            )
          )}
        </div>
      )}

      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={handleFile} />
    </div>
  );
}
