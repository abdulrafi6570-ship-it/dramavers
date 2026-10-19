import { useState } from "react";
import { useCreateVideo } from "@workspace/api-client-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, Check, X } from "lucide-react";
import { generateThumbnailFromVideoUrl } from "@/lib/generate-video-thumbnail";

const API_BASE = "https://quart-shallow-frog.abasthan.app";

type FileStatus = "pending" | "uploading" | "thumbnail" | "creating" | "done" | "error";

interface FileEntry {
  file: File;
  status: FileStatus;
}

function uploadVideoFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const token = localStorage.getItem("twixtor_token");
    const formData = new FormData();
    formData.append("file", file);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_BASE}/api/uploads`);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText).url);
        } catch {
          reject(new Error("Invalid response"));
        }
      } else {
        reject(new Error("Upload gagal: " + xhr.status));
      }
    };
    xhr.onerror = () => reject(new Error("Koneksi gagal"));
    xhr.send(formData);
  });
}

export function BulkVideoUploadDialog({
  open,
  onOpenChange,
  onDone,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone: () => void;
}) {
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [processing, setProcessing] = useState(false);
  const createVideo = useCreateVideo();

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    setEntries(Array.from(fileList).map((file) => ({ file, status: "pending" as FileStatus })));
  };

  const updateEntry = (index: number, patch: Partial<FileEntry>) => {
    setEntries((prev) => prev.map((e, i) => (i === index ? { ...e, ...patch } : e)));
  };

  const processAll = async () => {
    setProcessing(true);
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      if (entry.status === "done") continue;
      try {
        updateEntry(i, { status: "uploading" });
        const videoUrl = await uploadVideoFile(entry.file);

        updateEntry(i, { status: "thumbnail" });
        let thumbnailUrl: string | undefined;
        try {
          thumbnailUrl = await generateThumbnailFromVideoUrl(videoUrl);
        } catch {
          thumbnailUrl = undefined;
        }

        updateEntry(i, { status: "creating" });
        const title = entry.file.name.replace(/\.[^/.]+$/, "");
        await createVideo.mutateAsync({
          data: { title, type: "slomo", status: "draft", videoUrl, thumbnailUrl } as any,
        });

        updateEntry(i, { status: "done" });
      } catch {
        updateEntry(i, { status: "error" });
      }
    }
    setProcessing(false);
    onDone();
  };

  const reset = () => {
    setEntries([]);
    onOpenChange(false);
  };

  const allDone = entries.length > 0 && entries.every((e) => e.status === "done" || e.status === "error");

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!processing) {
          onOpenChange(o);
          if (!o) setEntries([]);
        }
      }}
    >
      <DialogContent className="bg-neutral-950 border-white/10 text-white max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">Bulk Upload Video</DialogTitle>
        </DialogHeader>

        {entries.length === 0 ? (
          <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-white/15 rounded-xl py-10 cursor-pointer hover:border-primary/50 transition-colors">
            <Upload className="h-8 w-8 text-white/40" />
            <span className="text-sm text-white/60">Pilih banyak video sekaligus</span>
            <input type="file" accept="video/*" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
          </label>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {entries.map((entry, i) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/5 text-sm">
                  <span className="flex-1 truncate text-white/80">{entry.file.name}</span>
                  {entry.status === "pending" && <span className="text-white/30 text-xs flex-shrink-0">Menunggu</span>}
                  {entry.status === "uploading" && <Loader2 className="h-4 w-4 animate-spin text-white/50 flex-shrink-0" />}
                  {entry.status === "thumbnail" && <span className="text-white/40 text-xs flex-shrink-0">Thumbnail...</span>}
                  {entry.status === "creating" && <Loader2 className="h-4 w-4 animate-spin text-white/50 flex-shrink-0" />}
                  {entry.status === "done" && <Check className="h-4 w-4 text-primary flex-shrink-0" />}
                  {entry.status === "error" && <X className="h-4 w-4 text-red-400 flex-shrink-0" />}
                </div>
              ))}
            </div>

            {!allDone ? (
              <Button onClick={processAll} disabled={processing} className="w-full bg-primary text-black hover:bg-primary/90">
                {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {processing ? "Mengupload..." : `Upload ${entries.length} Video`}
              </Button>
            ) : (
              <Button onClick={reset} className="w-full bg-primary text-black hover:bg-primary/90">
                Selesai — Tutup
              </Button>
            )}
            <p className="text-xs text-white/30 text-center">Video akan masuk sebagai draft. Edit judul/drama/aktor satu-satu setelah ini.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
