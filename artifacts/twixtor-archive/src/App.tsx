import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { DownloadProvider } from "@/contexts/DownloadContext";
import { DownloadTray } from "@/components/DownloadTray";
import { useEffect, useState, Suspense, lazy } from "react";
import { BgmPlayer } from "@/components/BgmPlayer";
import { AdOverlay } from "@/components/AdOverlay";
import Home from "@/pages/home";
import { FeedbackButton } from "@/components/FeedbackButton";

const NotFound = lazy(() => import("@/pages/not-found"));
const Dramas = lazy(() => import("@/pages/dramas/index"));
const DramaDetail = lazy(() => import("@/pages/dramas/[id]"));
const Actors = lazy(() => import("@/pages/actors/index"));
const ActorDetail = lazy(() => import("@/pages/actors/[id]"));
const Videos = lazy(() => import("@/pages/videos/index"));
const VideoDetail = lazy(() => import("@/pages/videos/[id]"));
const Search = lazy(() => import("@/pages/search/index"));
const Profile = lazy(() => import("@/pages/profile/index"));
const UserProfile = lazy(() => import("@/pages/users/[id]"));
const Favorites = lazy(() => import("@/pages/favorites/index"));
const Bookmarks = lazy(() => import("@/pages/bookmarks/index"));
const History = lazy(() => import("@/pages/history/index"));
const WatchHistory = lazy(() => import("@/pages/watch-history/index"));
const Collections = lazy(() => import("@/pages/collections/index"));
const AdminAnalytics = lazy(() => import("@/pages/admin/analytics"));
const Leaderboard = lazy(() => import("@/pages/leaderboard/index"));
const CollectionDetail = lazy(() => import("@/pages/collections/[id]"));
const Requests = lazy(() => import("@/pages/requests/index"));
const Login = lazy(() => import("@/pages/auth/login"));
const Register = lazy(() => import("@/pages/auth/register"));
const AdminLogin = lazy(() => import("@/pages/admin/login"));
const AdminDashboard = lazy(() => import("@/pages/admin/index"));
const AdminDramas = lazy(() => import("@/pages/admin/dramas"));
const AdminActors = lazy(() => import("@/pages/admin/actors"));
const AdminVideos = lazy(() => import("@/pages/admin/videos"));
const AdminUsers = lazy(() => import("@/pages/admin/users"));
const AdminCodes = lazy(() => import("@/pages/admin/codes"));
const AdminAds = lazy(() => import("@/pages/admin/ads"));
const AdminSettings = lazy(() => import("@/pages/admin/settings"));
const AdminFeedback = lazy(() => import("@/pages/admin/feedback"));
const GlobalChat = lazy(() => import("@/pages/chat/index"));
const Help = lazy(() => import("@/pages/help/index"));
const MessagesInbox = lazy(() => import("@/pages/messages/index"));
const ChatThread = lazy(() => import("@/pages/messages/[userId]"));
const GlobalChatPage = lazy(() => import("@/pages/messages/global"));

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

    return () => {
      window.removeEventListener("user-logged-in", onLogin);
    };
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

    return () => {
      window.removeEventListener("settings-updated", handler);
    };
  }, []);

  if (!bgmEnabled || !bgmUrl) return null;

  return <BgmPlayer src={bgmUrl} />;
}

function RouteFallback() {
  return (
    <div className="flex min-h-[40vh] w-full items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<RouteFallback />}>
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
        <Route path="/watch-history" component={WatchHistory} />
        <Route path="/collections" component={Collections} />
        <Route path="/admin/analytics" component={AdminAnalytics} />
        <Route path="/leaderboard" component={Leaderboard} />
        <Route path="/collections/:id" component={CollectionDetail} />
        <Route path="/requests" component={Requests} />
        <Route path="/chat" component={GlobalChat} />
        <Route path="/bantuan" component={Help} />
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
        <Route path="/chat" component={GlobalChat} />
        <Route path="/bantuan" component={Help} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <DownloadProvider>
            <WouterRouter
              base={import.meta.env.BASE_URL.replace(/\/$/, "")}
            >
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
