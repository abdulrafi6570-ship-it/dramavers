import { useGetVideo, getGetVideoQueryKey, useRecordView, useAddFavorite, useRemoveFavorite, useAddBookmark, useRemoveBookmark, useDownloadVideo, useListComments, getListCommentsQueryKey, useCreateComment, useDeleteComment } from "@workspace/api-client-react";
import { Navbar } from "@/components/layout/Navbar";
import { VideoCard } from "@/components/video/VideoCard";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useParams, useLocation } from "wouter";
import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Heart, Bookmark, Download, Copy, Play, MessageCircle, Trash2, ExternalLink, CornerDownRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const TIKTOK_USERNAME = "@rapzzelitcees1";
const TIKTOK_URL = "https://www.tiktok.com/@rapzzelitcees1";

export default function VideoDetail() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const { user, verifyCode } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [, setLocation] = useLocation();
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadStep, setDownloadStep] = useState<"tiktok" | "code">("tiktok");
  const [codeInput, setCodeInput] = useState("");
  const [commentText, setCommentText] = useState("");
  const [replyTo, setReplyTo] = useState<{ id: number; username: string } | null>(null);
  const [replyText, setReplyText] = useState("");
  const [videoAspect, setVideoAspect] = useState<number | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const { data: video, isLoading } = useGetVideo(id, { query: { enabled: !!id, queryKey: getGetVideoQueryKey(id) } });
  const { data: comments } = useListComments({ videoId: id }, { query: { enabled: !!id, queryKey: getListCommentsQueryKey({ videoId: id }) } });

  const recordView = useRecordView();
  const addFavorite = useAddFavorite();
  const removeFavorite = useRemoveFavorite();
  const addBookmark = useAddBookmark();
  const removeBookmark = useRemoveBookmark();
  const downloadVideo = useDownloadVideo();
  const createComment = useCreateComment();
  const deleteComment = useDeleteComment();

  useEffect(() => {
    if (id) recordView.mutate({ id });
  }, [id]);

  const invalidateVideo = () => qc.invalidateQueries({ queryKey: getGetVideoQueryKey(id) });
  const invalidateComments = () => qc.invalidateQueries({ queryKey: getListCommentsQueryKey({ videoId: id }) });

  async function handleDownloadClick() {
    if (!user) { setLocation("/login"); return; }
    if (!user.verified) {
      setDownloadStep("tiktok");
      setShowDownloadModal(true);
      return;
    }
    execDownload();
  }

  async function execDownload() {
    try {
      const res = await downloadVideo.mutateAsync({ id });
      if (!res.videoUrl) throw new Error("No URL");
      setDownloadProgress(0);
      const response = await fetch(res.videoUrl);
      if (!response.ok || !response.body) throw new Error("Fetch gagal");
      const contentLength = response.headers.get("content-length");
      const total = contentLength ? parseInt(contentLength, 10) : null;
      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      let received = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        received += value.length;
        if (total) setDownloadProgress(Math.round((received / total) * 100));
      }
      const blob = new Blob(chunks, { type: "video/mp4" });
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = (res.title || "video") + ".mp4";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
      setDownloadProgress(null);
      toast({ title: "Download selesai!" });
    } catch {
      setDownloadProgress(null);
      toast({ title: "Download gagal", variant: "destructive" });
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(window.location.href);
    toast({ title: "Link disalin!" });
  }

  async function handleVerify() {
    const ok = await verifyCode({ code: codeInput });
    if (ok) {
      setShowDownloadModal(false);
      setCodeInput("");
      execDownload();
    }
  }

  async function handleFavorite() {
    if (!user) { setLocation("/login"); return; }
    if (!video) return;
    const wasFavorited = video.isFavorited;
    qc.setQueryData(getGetVideoQueryKey(id), (old: any) =>
      old ? { ...old, isFavorited: !old.isFavorited, favoriteCount: (old.favoriteCount ?? 0) + (old.isFavorited ? -1 : 1) } : old
    );
    try {
      if (wasFavorited) await removeFavorite.mutateAsync({ videoId: id });
      else await addFavorite.mutateAsync({ videoId: id });
    } catch {
      invalidateVideo();
    }
  }

  async function handleBookmark() {
    if (!user) { setLocation("/login"); return; }
    if (!video) return;
    const wasBookmarked = video.isBookmarked;
    qc.setQueryData(getGetVideoQueryKey(id), (old: any) =>
      old ? { ...old, isBookmarked: !old.isBookmarked } : old
    );
    try {
      if (wasBookmarked) await removeBookmark.mutateAsync({ videoId: id });
      else await addBookmark.mutateAsync({ videoId: id });
    } catch {
      invalidateVideo();
    }
  }

  async function handleComment() {
    if (!user) { setLocation("/login"); return; }
    if (!commentText.trim()) return;
    try {
      await createComment.mutateAsync({ data: { videoId: id, text: commentText } });
      setCommentText("");
      invalidateComments();
    } catch {
      toast({ title: "Gagal mengirim komentar", variant: "destructive" });
    }
  }

  async function handleReply() {
    const currentReplyTo = replyTo;
    if (!user || !currentReplyTo) return;
    if (!replyText.trim()) return;
    try {
      const newReply = await createComment.mutateAsync({ data: { videoId: id, text: replyText, parentId: currentReplyTo.id } });
      setReplyText("");
      setReplyTo(null);
      qc.setQueryData(getListCommentsQueryKey({ videoId: id }), (old: any) => {
        if (!old) return old;
        return old.map((c: any) =>
          c.id === currentReplyTo.id
            ? { ...c, replies: [...(c.replies || []), { ...newReply, replies: [] }] }
            : c
        );
      });
      toast({ title: "Balasan terkirim!" });
    } catch {
      toast({ title: "Gagal mengirim balasan", variant: "destructive" });
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <main className="container mx-auto px-4 md:px-6 py-8">
          <div className="aspect-video rounded-2xl bg-white/5 animate-pulse mb-8" />
        </main>
      </div>
    );
  }

  if (!video) return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="container mx-auto px-4 py-16 flex flex-col items-center justify-center gap-4">
        <p className="text-white/40 text-sm">Video tidak ditemukan.</p>
        <Link href="/videos" className="text-primary text-sm hover:underline">← Kembali ke Videos</Link>
      </main>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 md:pb-0">
      <Navbar />
      <main className="container mx-auto px-4 md:px-6 py-8 max-w-7xl">
        <Link href="/videos" className="inline-flex items-center gap-2 text-white/40 hover:text-white mb-6 transition-colors text-sm">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-5">
            {/* Player — adapts to actual video aspect ratio */}
            <div
              className="relative rounded-2xl overflow-hidden border border-white/10 bg-black flex items-center justify-center"
              style={
                videoAspect !== null
                  ? {
                      aspectRatio: String(videoAspect),
                      maxHeight: "85vh",
                      width: videoAspect < 1 ? "min(100%, calc(85vh * " + videoAspect + "))" : "100%",
                      margin: "0 auto",
                    }
                  : { aspectRatio: "9/16", maxHeight: "85vh", width: "min(100%, calc(85vh * 9 / 16))", margin: "0 auto" }
              }
            >
              {video.videoUrl ? (
                <>
                <video
                  ref={videoRef}
                  src={video.videoUrl}
                  controls
                  poster={video.thumbnailUrl ?? undefined}
                  className="w-full h-full object-contain"
                  onLoadedMetadata={(e) => {
                    const v = e.currentTarget;
                    if (v.videoWidth && v.videoHeight) {
                      setVideoAspect(v.videoWidth / v.videoHeight);
                    }
                  }}
                />
                {downloadProgress !== null && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-black/70 backdrop-blur-sm">
                    <div className="relative w-20 h-20">
                      <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                        <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6"/>
                        <circle cx="40" cy="40" r="34" fill="none" stroke="white" strokeWidth="6"
                          strokeLinecap="round"
                          strokeDasharray={`${2 * Math.PI * 34}`}
                          strokeDashoffset={`${2 * Math.PI * 34 * (1 - downloadProgress / 100)}`}
                          style={{ transition: "stroke-dashoffset 0.3s ease" }}
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-white font-bold text-lg">
                        {downloadProgress}%
                      </span>
                    </div>
                    <p className="text-white/80 text-sm font-medium tracking-wide">Mengunduh video...</p>
                  </div>
                )}
                </>
              ) : video.thumbnailUrl ? (
                <div className="relative w-full h-full">
                  <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <div className="w-16 h-16 rounded-full bg-white/15 backdrop-blur flex items-center justify-center border border-white/20">
                      <Play className="h-7 w-7 text-white fill-white ml-1" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full bg-black/80 flex flex-col items-center justify-center gap-3">
                  <Play className="h-12 w-12 text-white/15" />
                  <p className="text-white/20 text-xs">Video belum diupload</p>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={handleDownloadClick}
                  className="flex-1 sm:flex-none bg-white hover:bg-white/90 text-black font-semibold"
                  disabled={downloadVideo.isPending || downloadProgress !== null}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {downloadProgress !== null ? `${downloadProgress}%` : "Download"}
                </Button>
                <Button variant="outline" onClick={handleCopy} className="border-white/15 text-white hover:bg-white/8">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Link
                </Button>
                <Button
                  variant="outline"
                  onClick={handleFavorite}
                  className={`border-white/15 hover:bg-white/8 ${video.isFavorited ? "text-red-400 border-red-400/30" : "text-white"}`}
                >
                  <Heart className="h-4 w-4" fill={video.isFavorited ? "currentColor" : "none"} />
                </Button>
                <Button
                  variant="outline"
                  onClick={handleBookmark}
                  className={`border-white/15 hover:bg-white/8 ${video.isBookmarked ? "text-blue-400 border-blue-400/30" : "text-white"}`}
                >
                  <Bookmark className="h-4 w-4" fill={video.isBookmarked ? "currentColor" : "none"} />
                </Button>
              </div>

              {/* TikTok CTA below download */}
              <div className="glass-panel rounded-xl p-3 border border-white/8 flex items-center gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-white" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white/50">Kode download tersedia di TikTok</p>
                  <a href={TIKTOK_URL} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-white hover:text-white/80 transition-colors">
                    {TIKTOK_USERNAME}
                  </a>
                </div>
                <a href={TIKTOK_URL} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 text-white/30 hover:text-white transition-colors">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>

            {/* Comments */}
            <div className="glass-panel rounded-2xl p-5 border border-white/8">
              <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-white/50" />
                Komentar {comments ? `(${comments.length})` : ""}
              </h3>
              {user && (
                <div className="flex gap-3 mb-5">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs text-white font-bold flex-shrink-0 overflow-hidden">
                    {(user as any).photoUrl
                      ? <img src={(user as any).photoUrl} alt={user.username} className="w-full h-full object-cover" />
                      : user.username.charAt(0).toUpperCase()
                    }
                  </div>
                  <div className="flex-1 space-y-2">
                    <Textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Tulis komentar..."
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/25 resize-none text-sm"
                      rows={2}
                      onKeyDown={(e) => { if (e.key === "Enter" && e.ctrlKey) handleComment(); }}
                    />
                    <Button onClick={handleComment} size="sm" className="bg-white hover:bg-white/90 text-black font-medium" disabled={!commentText.trim() || createComment.isPending}>
                      {createComment.isPending ? "Mengirim..." : "Kirim"}
                    </Button>
                  </div>
                </div>
              )}
              {!user && (
                <div className="text-center py-3 mb-4">
                  <Link href="/login" className="text-sm text-white/40 hover:text-white transition-colors">
                    Login untuk berkomentar
                  </Link>
                </div>
              )}
              <div className="space-y-4">
                {(() => {
                  if (!comments || comments.length === 0) {
                    return <p className="text-center text-sm text-white/20 py-4">Belum ada komentar</p>;
                  }
                  const topLevel = comments.filter((c: any) => !c.parentId);
                  return topLevel.map((comment: any) => (
                    <div key={comment.id}>
                      {/* Top-level comment */}
                      <div className="group flex gap-3">
                        <Link href={`/users/${comment.userId}`}>
                          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs text-white font-bold flex-shrink-0 cursor-pointer hover:bg-white/15 transition-colors overflow-hidden">
                            {comment.photoUrl
                              ? <img src={comment.photoUrl} alt={comment.username} className="w-full h-full object-cover" />
                              : comment.username.charAt(0).toUpperCase()}
                          </div>
                        </Link>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Link href={`/users/${comment.userId}`} className="text-sm font-medium text-white/80 hover:text-white transition-colors">
                              {comment.username}
                            </Link>
                            <span className="text-xs text-white/25">{new Date(comment.createdAt).toLocaleDateString("id-ID")}</span>
                            {user && (user.id === comment.userId || user.role === "admin") && (
                              <button
                                onClick={() => { deleteComment.mutate({ id: comment.id }); invalidateComments(); }}
                                className="ml-auto opacity-0 group-hover:opacity-100 text-white/25 hover:text-red-400 transition-all"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                          <p className="text-sm text-white/55 mt-0.5">{comment.text}</p>
                          {user && (
                            <button
                              onClick={() => { setReplyTo({ id: comment.id, username: comment.username }); setReplyText(""); }}
                              className="mt-1 flex items-center gap-1 text-xs text-white/25 hover:text-white/50 transition-colors"
                            >
                              <CornerDownRight className="h-3 w-3" />
                              Balas
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Reply input (inline, when replying to this comment) */}
                      {replyTo?.id === comment.id && replyTo && (
                        <div className="ml-11 mt-2 flex gap-2 items-start">
                          <div className="flex-1 space-y-1.5">
                            <div className="flex items-center gap-2 text-xs text-white/35 mb-1">
                              <CornerDownRight className="h-3 w-3" />
                              Membalas <span className="text-white/55 font-medium">@{(replyTo as NonNullable<typeof replyTo>).username}</span>
                              <button onClick={() => setReplyTo(null)} className="ml-auto text-white/20 hover:text-white/40">
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                            <Textarea
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder={`Balas @${(replyTo as NonNullable<typeof replyTo>).username}...`}
                              className="bg-white/5 border-white/10 text-white placeholder:text-white/25 resize-none text-sm"
                              rows={2}
                              autoFocus
                              onKeyDown={(e) => { if (e.key === "Enter" && e.ctrlKey) handleReply(); }}
                            />
                            <div className="flex gap-2">
                              <Button onClick={handleReply} size="sm" className="bg-white hover:bg-white/90 text-black font-medium text-xs h-7 px-3" disabled={!replyText.trim() || createComment.isPending}>
                                Kirim Balasan
                              </Button>
                              <Button onClick={() => setReplyTo(null)} size="sm" variant="ghost" className="text-white/40 text-xs h-7 px-3">
                                Batal
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Nested replies */}
                      {comment.replies?.length > 0 && (
                        <div className="ml-11 mt-3 space-y-3 border-l border-white/[0.06] pl-3">
                          {comment.replies.map((reply: any) => (
                            <div key={reply.id} className="group flex gap-2">
                              <Link href={`/users/${reply.userId}`}>
                                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] text-white font-bold flex-shrink-0 cursor-pointer hover:bg-white/15 transition-colors overflow-hidden">
                                  {reply.photoUrl
                                    ? <img src={reply.photoUrl} alt={reply.username} className="w-full h-full object-cover" />
                                    : reply.username.charAt(0).toUpperCase()}
                                </div>
                              </Link>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <Link href={`/users/${reply.userId}`} className="text-xs font-medium text-white/70 hover:text-white transition-colors">
                                    {reply.username}
                                  </Link>
                                  <span className="text-[10px] text-white/20">{new Date(reply.createdAt).toLocaleDateString("id-ID")}</span>
                                  {user && (user.id === reply.userId || user.role === "admin") && (
                                    <button
                                      onClick={() => { deleteComment.mutate({ id: reply.id }); invalidateComments(); }}
                                      className="ml-auto opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400 transition-all"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  )}
                                </div>
                                <p className="text-xs text-white/50 mt-0.5">{reply.text}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="glass-panel rounded-2xl p-5 border border-white/8">
              <div className="flex flex-wrap gap-2 mb-3">
                <span className={`text-xs font-bold px-2 py-1 rounded text-black ${video.type === "slomo" ? "bg-white" : "bg-white/60"}`}>
                  {video.type === "slomo" ? "SLOMO" : "NORMAL"}
                </span>
              </div>
              <h1 className="text-xl font-bold text-white mb-3 leading-tight">{video.title}</h1>

              {video.drama && (
                <Link href={`/dramas/${video.drama.id}`} className="block text-sm text-white/70 hover:text-white mb-1 transition-colors">
                  {video.drama.name}
                </Link>
              )}
              {video.actor && (
                <Link href={`/actors/${video.actor.id}`} className="block text-xs text-white/40 hover:text-white/60 mb-3 transition-colors">
                  {video.actor.name}
                </Link>
              )}

              <div className="grid grid-cols-2 gap-3 text-xs">
                {video.episode && <div><span className="text-white/35">Episode</span><p className="text-white font-medium mt-0.5">{video.episode}</p></div>}
                {video.scene && <div><span className="text-white/35">Scene</span><p className="text-white font-medium mt-0.5">{video.scene}</p></div>}
                {video.resolution && <div><span className="text-white/35">Resolusi</span><p className="text-white font-medium mt-0.5">{video.resolution}</p></div>}
                {video.fps && <div><span className="text-white/35">FPS</span><p className="text-white font-medium mt-0.5">{video.fps}</p></div>}
                {video.format && <div><span className="text-white/35">Format</span><p className="text-white font-medium mt-0.5">{video.format}</p></div>}
                {video.fileSize && <div><span className="text-white/35">Ukuran</span><p className="text-white font-medium mt-0.5">{(video.fileSize / 1024 / 1024).toFixed(1)} MB</p></div>}
              </div>

              {video.tags && video.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-4">
                  {video.tags.map((tag, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-white/8 text-white/40">#{tag}</span>
                  ))}
                </div>
              )}

              <div className="flex gap-4 mt-4 pt-4 border-t border-white/8 text-xs text-white/30">
                <span>{video.viewCount?.toLocaleString()} views</span>
                <span>{video.downloadCount?.toLocaleString()} downloads</span>
                <span>{video.favoriteCount?.toLocaleString()} likes</span>
              </div>
            </div>

            {video.relatedVideos && video.relatedVideos.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-white/60 mb-3">Clip Terkait</h3>
                <div className="grid grid-cols-2 gap-2">
                  {video.relatedVideos.slice(0, 4).map((v) => (
                    <VideoCard key={v.id} video={v} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Download Progress Bar */}
      {downloadProgress !== null && (
        <div className="fixed bottom-24 left-4 right-4 z-50 flex justify-center">
          <div className="bg-black/90 border border-white/10 rounded-2xl p-4 backdrop-blur-md shadow-2xl w-full max-w-sm">
            <div className="flex justify-between items-center text-sm text-white mb-2">
              <span className="font-medium">Mengunduh video...</span>
              <span className="text-primary font-bold">{downloadProgress}%</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-200"
                style={{ width: `${downloadProgress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Download Modal */}
      <Dialog open={showDownloadModal} onOpenChange={setShowDownloadModal}>
        <DialogContent className="glass-panel-strong border border-white/10 text-white max-w-sm">
          {downloadStep === "tiktok" ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-white text-lg">Download Terkunci 🔒</DialogTitle>
              </DialogHeader>
              <div className="space-y-5 py-2">
                <p className="text-white/60 text-sm leading-relaxed">
                  Untuk download, kamu perlu kode akses. Kode tersedia di TikTok kami!
                </p>
                <a href={TIKTOK_URL} target="_blank" rel="noopener noreferrer"
                  className="block glass-panel rounded-xl p-4 border border-white/12 hover:border-white/25 transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                      <svg viewBox="0 0 24 24" className="h-6 w-6 fill-white" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-white/50 mb-0.5">Follow & cari kode di</p>
                      <p className="font-bold text-white text-base group-hover:text-white/80 transition-colors">{TIKTOK_USERNAME}</p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-white/30 ml-auto" />
                  </div>
                </a>
                <Button onClick={() => setDownloadStep("code")} className="w-full bg-white hover:bg-white/90 text-black font-semibold">
                  Sudah Follow? Masukkan Kode →
                </Button>
              </div>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="text-white text-lg">Masukkan Kode Akses</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <p className="text-white/50 text-sm">
                  Masukkan kode yang kamu dapat dari TikTok{" "}
                  <span className="text-white font-medium">{TIKTOK_USERNAME}</span>
                </p>
                <Input
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                  placeholder="Contoh: TWIXTOR2024"
                  className="bg-white/5 border-white/12 text-white placeholder:text-white/25 text-center font-mono text-lg tracking-widest h-12"
                  onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                />
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setDownloadStep("tiktok")} className="flex-1 border-white/15 text-white/60 hover:text-white hover:bg-white/8">
                    ← Kembali
                  </Button>
                  <Button onClick={handleVerify} className="flex-1 bg-white hover:bg-white/90 text-black font-semibold" disabled={!codeInput.trim()}>
                    Verify & Download
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
