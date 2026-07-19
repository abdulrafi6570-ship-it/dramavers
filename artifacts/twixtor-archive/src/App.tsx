import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { DownloadProvider } from "@/contexts/DownloadContext";
import { DownloadTray } from "@/components/DownloadTray";
import { useEffect, useState } from "react";
import { BgmPlayer } from "@/components/BgmPlayer";
import { AdOverlay } from "@/components/AdOverlay";

import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Dramas from "@/pages/dramas/index";
import DramaDetail from "@/pages/dramas/[id]";
import Actors from "@/pages/actors/index";
import ActorDetail from "@/pages/actors/[id]";
import Videos from "@/pages/videos/index";
import VideoDetail from "@/pages/videos/[id]";
import Search from "@/pages/search/index";
import Profile from "@/pages/profile/index";
import UserProfile from "@/pages/users/[id]";
import Favorites from "@/pages/favorites/index";
import Bookmarks from "@/pages/bookmarks/index";
import History from "@/pages/history/index";
import Requests from "@/pages/requests/index";
import Login from "@/pages/auth/login";
import Register from "@/pages/auth/register";
import AdminLogin from "@/pages/admin/login";
import AdminDashboard from "@/pages/admin/index";
import AdminDramas from "@/pages/admin/dramas";
import AdminActors from "@/pages/admin/actors";
import AdminVideos from "@/pages/admin/videos";
import AdminUsers from "@/pages/admin/users";
import AdminCodes from "@/pages/admin/codes";
import AdminAds from "@/pages/admin/ads";
import AdminSettings from "@/pages/admin/settings";
import AdminFeedback from "@/pages/admin/feedback";
import GlobalChat from "@/pages/chat/index";
import MessagesInbox from "@/pages/messages/index";
import ChatThread from "@/pages/messages/[userId]";
import GlobalChatPage from "@/pages/messages/global";
import { FeedbackButton } from "@/components/FeedbackButton";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

interface AdData {
  id: number;
  type: "image" | "video";
  mediaUrl: string;
  title?: string | null;
  description?: string | null;
  durationSeconds?: number | null;
  linkUrl?: string | null;
}

function AdManager() {
  const [ad, setAd] = useState<AdData | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const fetchAndShowAd = async () => {
    try {
      const r = await fetch("/api/ads/active");
      const data: AdData | null = await r.json();
      if (!data) return;
      setAd(data);
      setDismissed(false);
    } catch {}
  };

  useEffect(() => {
    fetchAndShowAd();
    const onLogin = () => fetchAndShowAd();
    window.addEventListener("user-logged-in", onLogin);
    return () => window.removeEventListener("user-logged-in", onLogin);
  }, []);

  const handleClose = () => setDismissed(true);

  if (!ad || dismissed) return null;
  return <AdOverlay ad={ad} onClose={handleClose} />;
}

function BgmManager() {
  const [bgmUrl, setBgmUrl] = useState("");
  const [bgmEnabled, setBgmEnabled] = useState(false);

  const fetchSettings = async () => {
    try {
      const [urlRes, enabledRes] = await Promise.all([
        fetch("/api/settings/bgm_url"),
        fetch("/api/settings/bgm_enabled"),
      ]);
      const urlData = await urlRes.json();
      const enabledData = await enabledRes.json();
      setBgmUrl(urlData?.value ?? "");
      setBgmEnabled(enabledData?.value === "true");
    } catch {}
  };

  useEffect(() => {
    fetchSettings();
    const handler = () => fetchSettings();
    window.addEventListener("settings-updated", handler);
    return () => window.removeEventListener("settings-updated", handler);
  }, []);

  if (!bgmEnabled || !bgmUrl) return null;
  return <BgmPlayer src={bgmUrl} />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/dramas" component={Dramas} />
      <Route path="/dramas/:id" component={DramaDetail} />
      <Route path="/actors" component={Actors} />
      <Route path="/actors/:id" component={ActorDetail} />
      <Route path="/videos" component={Videos} />
      <Route path="/videos/:id" component={VideoDetail} />
      <Route path="/search" component={Search} />
      <Route path="/profile" component={Profile} />
      <Route path="/users/:id" component={UserProfile} />
      <Route path="/favorites" component={Favorites} />
      <Route path="/bookmarks" component={Bookmarks} />
      <Route path="/history" component={History} />
      <Route path="/requests" component={Requests} />
      <Route path="/chat" component={GlobalChat} />
      <Route path="/messages" component={MessagesInbox} />
      <Route path="/messages/global" component={GlobalChatPage} />
      <Route path="/messages/:userId" component={ChatThread} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/dramas" component={AdminDramas} />
      <Route path="/admin/actors" component={AdminActors} />
      <Route path="/admin/videos" component={AdminVideos} />
      <Route path="/admin/users" component={AdminUsers} />
      <Route path="/admin/codes" component={AdminCodes} />
      <Route path="/admin/ads" component={AdminAds} />
      <Route path="/admin/settings" component={AdminSettings} />
      <Route path="/admin/feedback" component={AdminFeedback} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <DownloadProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
              <FeedbackButton />
            </WouterRouter>
            <AdManager />
            <BgmManager />
            <Toaster />
            <DownloadTray />
          </DownloadProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
