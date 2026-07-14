import { useListRequests, getListRequestsQueryKey, useCreateRequest, useUpdateRequest } from "@workspace/api-client-react";
import { Navbar } from "@/components/layout/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { useLocation } from "wouter";
import { Send, Plus, Clock, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const statusIcon: Record<string, JSX.Element> = {
  pending: <Clock className="h-3.5 w-3.5 text-yellow-400" />,
  fulfilled: <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />,
  rejected: <XCircle className="h-3.5 w-3.5 text-red-400" />,
};

export default function Requests() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: requests, isLoading } = useListRequests();
  const createRequest = useCreateRequest();

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  async function handleSubmit() {
    if (!user) { setLocation("/login"); return; }
    if (!title.trim()) { toast({ title: "Title is required", variant: "destructive" }); return; }
    await createRequest.mutateAsync({ data: { title, description: description || undefined } });
    setTitle(""); setDescription("");
    setShowForm(false);
    qc.invalidateQueries({ queryKey: getListRequestsQueryKey() });
    toast({ title: "Request submitted!" });
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 md:pb-0">
      <Navbar />
      <main className="container mx-auto px-4 md:px-6 py-8 max-w-3xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-brand text-3xl tracking-[0.06em] text-white">Content Requests</h1>
          <Button onClick={() => setShowForm(!showForm)} className="bg-primary hover:bg-primary/90 text-black font-semibold">
            <Plus className="h-4 w-4 mr-2" />
            Request Clip
          </Button>
        </div>

        {showForm && (
          <div className="glass-panel rounded-2xl p-5 border border-white/10 mb-6 space-y-3">
            <h2 className="font-heading text-lg text-white">New Request</h2>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Drama / Actor / Scene name *"
              className="bg-black/40 border-white/10 text-white placeholder:text-white/30"
            />
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Additional details (episode, timestamp, etc.)"
              className="bg-black/40 border-white/10 text-white placeholder:text-white/30 min-h-[80px]"
            />
            <div className="flex gap-2">
              <Button onClick={handleSubmit} className="flex-1 bg-primary hover:bg-primary/90 text-black font-semibold" disabled={createRequest.isPending}>
                <Send className="h-4 w-4 mr-2" />
                Submit
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)} className="border-white/20 text-white hover:bg-white/10">Cancel</Button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse" />)}
          </div>
        ) : (
          <div className="space-y-3">
            {(requests ?? []).length === 0 && (
              <div className="text-center py-16 text-white/30">No requests yet. Be the first!</div>
            )}
            {(requests ?? []).map((req) => (
              <div key={req.id} className="glass-panel rounded-xl p-4 border border-white/10 flex items-start gap-4">
                <div className="mt-1">{statusIcon[req.status] ?? statusIcon.pending}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white">{req.title}</p>
                  {req.description && (
                    <p className="text-sm text-white/50 mt-0.5 line-clamp-2">{req.description}</p>
                  )}
                  <p className="text-xs text-white/30 mt-1.5">
                    {new Date(req.createdAt).toLocaleDateString()} · {req.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
