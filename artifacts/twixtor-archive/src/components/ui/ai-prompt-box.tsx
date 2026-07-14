import React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { ArrowUp, Paperclip, Mic, StopCircle, X, Play, Pause } from "lucide-react";
import { motion } from "framer-motion";

const cn = (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(" ");

const TooltipProvider = TooltipPrimitive.Provider;
const Tooltip = TooltipPrimitive.Root;
const TooltipTrigger = TooltipPrimitive.Trigger;
const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn("z-50 rounded-md border border-white/10 bg-black/90 px-2.5 py-1 text-xs text-white shadow-md", className)}
    {...props}
  />
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

interface PromptInputContextType {
  isLoading: boolean;
  value: string;
  setValue: (value: string) => void;
  maxHeight: number | string;
  onSubmit?: () => void;
  disabled?: boolean;
}
const PromptInputContext = React.createContext<PromptInputContextType>({
  isLoading: false, value: "", setValue: () => {}, maxHeight: 240, onSubmit: undefined, disabled: false,
});
function usePromptInput() { return React.useContext(PromptInputContext); }

interface PromptInputProps {
  isLoading?: boolean;
  value?: string;
  onValueChange?: (value: string) => void;
  maxHeight?: number | string;
  onSubmit?: () => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
}
const PromptInput = React.forwardRef<HTMLDivElement, PromptInputProps>(
  ({ className, isLoading = false, maxHeight = 240, value, onValueChange, onSubmit, children, disabled = false, onDragOver, onDragLeave, onDrop }, ref) => {
    const [internalValue, setInternalValue] = React.useState(value || "");
    const handleChange = (v: string) => { setInternalValue(v); onValueChange?.(v); };
    return (
      <TooltipProvider>
        <PromptInputContext.Provider value={{ isLoading, value: value ?? internalValue, setValue: onValueChange ?? handleChange, maxHeight, onSubmit, disabled }}>
          <div ref={ref} className={cn("rounded-2xl border border-white/10 bg-white/5 p-2 shadow-lg", className)}
            onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}>
            {children}
          </div>
        </PromptInputContext.Provider>
      </TooltipProvider>
    );
  }
);
PromptInput.displayName = "PromptInput";

const PromptInputTextarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & { disableAutosize?: boolean }> = ({
  className, onKeyDown, disableAutosize = false, ...props
}) => {
  const { value, setValue, maxHeight, onSubmit, disabled } = usePromptInput();
  const ref = React.useRef<HTMLTextAreaElement>(null);
  React.useEffect(() => {
    if (disableAutosize || !ref.current) return;
    ref.current.style.height = "auto";
    ref.current.style.height = typeof maxHeight === "number"
      ? `${Math.min(ref.current.scrollHeight, maxHeight)}px`
      : `min(${ref.current.scrollHeight}px, ${maxHeight})`;
  }, [value, maxHeight, disableAutosize]);
  return (
    <textarea ref={ref} value={value} onChange={(e) => setValue(e.target.value)}
      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSubmit?.(); } onKeyDown?.(e); }}
      className={cn("flex w-full bg-transparent px-3 py-2 text-sm text-gray-100 placeholder:text-gray-400 focus-visible:outline-none resize-none min-h-[40px]", className)}
      rows={1} disabled={disabled} {...props} />
  );
};

const PromptInputActions: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className, ...props }) => (
  <div className={cn("flex items-center gap-2", className)} {...props}>{children}</div>
);

interface PromptInputActionProps extends React.ComponentProps<typeof Tooltip> {
  tooltip: React.ReactNode;
  children: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
}
const PromptInputAction: React.FC<PromptInputActionProps> = ({ tooltip, children, side = "top", ...props }) => {
  const { disabled } = usePromptInput();
  return (
    <Tooltip {...props}>
      <TooltipTrigger asChild disabled={disabled}>{children}</TooltipTrigger>
      <TooltipContent side={side}>{tooltip}</TooltipContent>
    </Tooltip>
  );
};

function formatTime(s: number) {
  return `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
}

interface AudioPreviewProps {
  url: string;
  onRemove: () => void;
  duration: number;
}
function AudioPreview({ url, onRemove, duration }: AudioPreviewProps) {
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = React.useState(false);

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else { audioRef.current.play(); setPlaying(true); }
  };

  return (
    <div className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2 mb-2">
      <button onClick={toggle} className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center flex-shrink-0">
        {playing ? <Pause className="h-3 w-3 text-white" /> : <Play className="h-3 w-3 text-white ml-0.5" />}
      </button>
      <div className="flex-1">
        <div className="flex items-center gap-0.5 h-4">
          {[...Array(24)].map((_, i) => (
            <div key={i} className="w-0.5 rounded-full bg-white/30"
              style={{ height: `${30 + Math.sin(i * 0.8) * 40 + Math.cos(i * 1.3) * 20}%` }} />
          ))}
        </div>
      </div>
      <span className="text-[10px] text-white/40 flex-shrink-0 font-mono">{formatTime(duration)}</span>
      <button onClick={onRemove} className="ml-1 text-white/30 hover:text-white/60">
        <X className="h-3 w-3" />
      </button>
      <audio ref={audioRef} src={url} onEnded={() => setPlaying(false)} />
    </div>
  );
}

export interface FeedbackPromptBoxProps {
  onSend?: (message: string, attachmentUrl?: string, mimeType?: string) => void | Promise<void>;
  isLoading?: boolean;
  placeholder?: string;
  className?: string;
}

export const FeedbackPromptBox = React.forwardRef<HTMLDivElement, FeedbackPromptBoxProps>((props, ref) => {
  const { onSend = () => {}, isLoading = false, placeholder = "Tulis pesanmu ke admin...", className } = props;
  const [input, setInput] = React.useState("");

  const [file, setFile] = React.useState<File | null>(null);
  const [filePreview, setFilePreview] = React.useState<string | null>(null);
  const [fileType, setFileType] = React.useState<"image" | "video" | null>(null);

  const [isRecording, setIsRecording] = React.useState(false);
  const [recordTime, setRecordTime] = React.useState(0);
  const [audioBlob, setAudioBlob] = React.useState<Blob | null>(null);
  const [audioBlobUrl, setAudioBlobUrl] = React.useState<string | null>(null);
  const [audioDuration, setAudioDuration] = React.useState(0);

  const [uploading, setUploading] = React.useState(false);
  const [micError, setMicError] = React.useState(false);

  const uploadInputRef = React.useRef<HTMLInputElement>(null);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const chunksRef = React.useRef<BlobPart[]>([]);
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);

  const processFile = (f: File) => {
    if (f.size > 100 * 1024 * 1024) return;
    setFile(f);
    if (f.type.startsWith("image/")) {
      setFileType("image");
      const reader = new FileReader();
      reader.onload = (e) => setFilePreview(e.target?.result as string);
      reader.readAsDataURL(f);
    } else if (f.type.startsWith("video/")) {
      setFileType("video");
      setFilePreview(URL.createObjectURL(f));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = Array.from(e.dataTransfer.files)[0];
    if (f) processFile(f);
  };

  const handlePaste = React.useCallback((e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith("image/") || items[i].type.startsWith("video/")) {
        const f = items[i].getAsFile();
        if (f) { e.preventDefault(); processFile(f); break; }
      }
    }
  }, []);

  React.useEffect(() => {
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [handlePaste]);

  const startRecording = async () => {
    setMicError(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      chunksRef.current = [];

      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" });
        setAudioBlob(blob);
        setAudioBlobUrl(URL.createObjectURL(blob));
      };

      mr.start(100);
      setIsRecording(true);
      setRecordTime(0);
      timerRef.current = setInterval(() => setRecordTime(t => t + 1), 1000);
    } catch {
      setMicError(true);
    }
  };

  const stopRecording = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setAudioDuration(recordTime);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const uploadFile = async (f: File | Blob, filename?: string): Promise<{ url: string; mimeType: string } | undefined> => {
    try {
      const formData = new FormData();
      const token = localStorage.getItem("twixtor_token");
      if (f instanceof File) {
        formData.append("file", f);
      } else {
        const ext = (f as Blob).type.includes("webm") ? ".webm" : (f as Blob).type.includes("ogg") ? ".ogg" : ".m4a";
        formData.append("file", f, filename ?? `voice${ext}`);
      }
      const res = await fetch("/api/feedback/upload", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!res.ok) return undefined;
      const data = await res.json();
      return { url: data.url as string, mimeType: (data.mimetype as string) ?? (f instanceof File ? f.type : (f as Blob).type) };
    } catch {
      return undefined;
    }
  };

  const handleSubmit = async () => {
    const hasText = input.trim() !== "";
    const hasFile = !!file;
    const hasAudio = !!audioBlob;
    if (!hasText && !hasFile && !hasAudio) return;

    setUploading(true);
    try {
      let attachmentUrl: string | undefined;
      let attachmentMimeType: string | undefined;
      if (hasAudio && audioBlob) {
        const result = await uploadFile(audioBlob);
        attachmentUrl = result?.url;
        attachmentMimeType = result?.mimeType;
      } else if (hasFile && file) {
        const result = await uploadFile(file);
        attachmentUrl = result?.url;
        attachmentMimeType = result?.mimeType;
      }
      await onSend(input.trim(), attachmentUrl, attachmentMimeType);
      setInput("");
      setFile(null);
      setFilePreview(null);
      setFileType(null);
      setAudioBlob(null);
      if (audioBlobUrl) URL.revokeObjectURL(audioBlobUrl);
      setAudioBlobUrl(null);
      setAudioDuration(0);
    } finally {
      setUploading(false);
    }
  };

  const clearFile = () => { setFile(null); setFilePreview(null); setFileType(null); };
  const clearAudio = () => {
    setAudioBlob(null);
    if (audioBlobUrl) URL.revokeObjectURL(audioBlobUrl);
    setAudioBlobUrl(null);
    setAudioDuration(0);
  };

  const hasContent = input.trim() !== "" || !!file || !!audioBlob;
  const busy = isLoading || uploading;

  return (
    <PromptInput
      value={input}
      onValueChange={setInput}
      isLoading={busy}
      onSubmit={handleSubmit}
      className={cn("w-full", className)}
      ref={ref}
      disabled={busy || isRecording}
      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
      onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); }}
      onDrop={handleDrop}
    >
      {filePreview && (
        <div className="flex gap-2 pb-2">
          <div className="relative group max-w-[120px] rounded-xl overflow-hidden">
            {fileType === "image" ? (
              <img src={filePreview} alt="preview" className="w-full object-cover max-h-24" />
            ) : (
              <video src={filePreview} className="w-full max-h-24 object-cover" muted />
            )}
            <button onClick={clearFile}
              className="absolute top-1 right-1 rounded-full bg-black/70 p-0.5 hover:bg-black/90">
              <X className="h-3 w-3 text-white" />
            </button>
          </div>
        </div>
      )}

      {audioBlobUrl && !isRecording && (
        <AudioPreview url={audioBlobUrl} duration={audioDuration} onRemove={clearAudio} />
      )}

      {isRecording ? (
        <div className="flex flex-col items-center justify-center w-full py-2 gap-2">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            <span className="font-mono text-sm text-white/80">{formatTime(recordTime)}</span>
            <span className="text-xs text-white/30">Merekam...</span>
          </div>
          <div className="w-full h-8 flex items-center justify-center gap-0.5 px-4">
            {[...Array(28)].map((_, i) => (
              <div key={i} className="w-0.5 rounded-full bg-red-400/50 animate-pulse"
                style={{ height: `${20 + Math.abs(Math.sin(i * 0.7 + Date.now() * 0.001)) * 80}%`, animationDelay: `${i * 0.05}s` }} />
            ))}
          </div>
        </div>
      ) : (
        <PromptInputTextarea
          placeholder={placeholder}
          className="text-sm text-white/90 placeholder:text-white/30"
          disabled={busy}
        />
      )}

      {micError && (
        <p className="text-xs text-red-400/70 px-3 pb-1">Izin mikrofon ditolak atau tidak tersedia</p>
      )}

      <PromptInputActions className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-1">
          {!audioBlob && (
            <PromptInputAction tooltip="Upload foto/video">
              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
                onClick={() => uploadInputRef.current?.click()}
                className="flex h-8 w-8 text-white/30 cursor-pointer items-center justify-center rounded-full hover:bg-white/10 hover:text-white/60 transition-colors"
                disabled={busy || isRecording}>
                <Paperclip className="h-4 w-4" />
                <input ref={uploadInputRef} type="file" className="hidden" accept="image/*,video/*"
                  onChange={(e) => { if (e.target.files?.[0]) processFile(e.target.files[0]); if (e.target) e.target.value = ""; }} />
              </motion.button>
            </PromptInputAction>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!file && !audioBlob && (
            <PromptInputAction tooltip={isRecording ? "Stop rekam" : "Voice note"}>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center transition-all",
                  isRecording ? "bg-red-500/20 hover:bg-red-500/30 text-red-400 ring-2 ring-red-500/30"
                    : "bg-white/10 hover:bg-white/15 text-white/40"
                )}
                onClick={() => isRecording ? stopRecording() : startRecording()}
                disabled={busy || !!file}>
                {isRecording ? <StopCircle className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </motion.button>
            </PromptInputAction>
          )}

          <PromptInputAction tooltip="Kirim">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center transition-all",
                hasContent && !isRecording ? "bg-white hover:bg-white/90 text-black" : "bg-white/10 text-white/20"
              )}
              onClick={handleSubmit}
              disabled={busy || isRecording || !hasContent}>
              {busy ? (
                <div className="h-3.5 w-3.5 border-2 border-black/30 border-t-black/80 rounded-full animate-spin" />
              ) : (
                <ArrowUp className="h-4 w-4" />
              )}
            </motion.button>
          </PromptInputAction>
        </div>
      </PromptInputActions>
    </PromptInput>
  );
});
FeedbackPromptBox.displayName = "FeedbackPromptBox";
