import sys, os

def replace_once(path, old, new, label):
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    count = content.count(old)
    if count != 1:
        print(f"[FAIL] {label}: expected 1 match, found {count} in {path}")
        sys.exit(1)
    content = content.replace(old, new)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"[OK] {label}")

AUTH_ROUTE_PATH = "artifacts/api-server/src/routes/auth.ts"
CONTEXT_PATH = "artifacts/twixtor-archive/src/contexts/AuthContext.tsx"
UPLOADER_PATH = "artifacts/twixtor-archive/src/components/FileUploader.tsx"
TOKEN_LIB_PATH = "artifacts/twixtor-archive/src/lib/token-refresh.ts"

replace_once(
    AUTH_ROUTE_PATH,
    """  res.status(201).json({
    user: { id: user.id, username: user.username, role: user.role, verified: user.verified, photoUrl: null, bio: null, createdAt: user.createdAt.toISOString(), followerCount: 0, followingCount: 0 },
    token: signInData.session.access_token,
  });
});""",
    """  res.status(201).json({
    user: { id: user.id, username: user.username, role: user.role, verified: user.verified, photoUrl: null, bio: null, createdAt: user.createdAt.toISOString(), followerCount: 0, followingCount: 0 },
    token: signInData.session.access_token,
    refreshToken: signInData.session.refresh_token,
  });
});""",
    "Include refreshToken in /auth/register response",
)

replace_once(
    AUTH_ROUTE_PATH,
    """  const userWithCounts = await getUserWithCounts(user.id);
  res.json({ user: userWithCounts, token: signInData.session.access_token });
});""",
    """  const userWithCounts = await getUserWithCounts(user.id);
  res.json({ user: userWithCounts, token: signInData.session.access_token, refreshToken: signInData.session.refresh_token });
});""",
    "Include refreshToken in /auth/login response",
)

replace_once(
    AUTH_ROUTE_PATH,
    """router.post("/auth/logout", async (_req, res): Promise<void> => {
  res.json({ success: true });
});""",
    """router.post("/auth/logout", async (_req, res): Promise<void> => {
  res.json({ success: true });
});

router.post("/auth/refresh", async (req, res): Promise<void> => {
  const refreshToken = typeof req.body?.refreshToken === "string" ? req.body.refreshToken : null;
  if (!refreshToken) { res.status(400).json({ error: "Missing refresh token" }); return; }

  const { data, error } = await supabaseAnon.auth.refreshSession({ refresh_token: refreshToken });
  if (error || !data.session) {
    res.status(401).json({ error: "Invalid or expired refresh token" });
    return;
  }

  res.json({ token: data.session.access_token, refreshToken: data.session.refresh_token });
});""",
    "Add POST /auth/refresh endpoint",
)

os.makedirs(os.path.dirname(TOKEN_LIB_PATH), exist_ok=True)
if os.path.exists(TOKEN_LIB_PATH):
    print(f"[FAIL] {TOKEN_LIB_PATH} already exists — refusing to overwrite")
    sys.exit(1)

with open(TOKEN_LIB_PATH, "w", encoding="utf-8") as f:
    f.write('''const REFRESH_ENDPOINT = "https://dramavers-production.up.railway.app/api/auth/refresh";

/**
 * Exchanges the stored refresh token for a brand-new access token + refresh
 * token pair, and writes both back to localStorage.
 *
 * Returns the new access token on success. Returns null if there was no
 * refresh token to use, or if the server rejected it (in which case the
 * stored tokens are cleared, so the user will be asked to log in again).
 * A network hiccup does NOT clear anything — we just give up silently and
 * let the caller keep using whatever token it already has.
 */
export async function refreshTwixtorToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem("twixtor_refresh_token");
  if (!refreshToken) return null;

  try {
    const res = await fetch(REFRESH_ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      localStorage.removeItem("twixtor_token");
      localStorage.removeItem("twixtor_refresh_token");
      return null;
    }

    const data = await res.json();
    localStorage.setItem("twixtor_token", data.token);
    localStorage.setItem("twixtor_refresh_token", data.refreshToken);
    return data.token as string;
  } catch {
    return null;
  }
}
''')
print("[OK] Create token-refresh.ts helper")

replace_once(
    CONTEXT_PATH,
    """import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";""",
    """import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { refreshTwixtorToken } from "@/lib/token-refresh";""",
    "Import refreshTwixtorToken helper into AuthContext",
)

replace_once(
    CONTEXT_PATH,
    """  const [user, setUser] = useState<User | null>(null);
  const { data: meData, isLoading: isLoadingMe } = useGetMe({ query: { queryKey: getGetMeQueryKey(), retry: false } });""",
    """  const [user, setUser] = useState<User | null>(null);
  const [tokenRefreshReady, setTokenRefreshReady] = useState(false);
  const { data: meData, isLoading: isLoadingMe } = useGetMe({ query: { queryKey: getGetMeQueryKey(), retry: false, enabled: tokenRefreshReady } });""",
    "Gate the 'who am I' check on the initial token refresh finishing",
)

replace_once(
    CONTEXT_PATH,
    """  useEffect(() => {
    if (meData) setUser(meData);
    else if (!isLoadingMe) setUser(null);
  }, [meData, isLoadingMe]);""",
    """  useEffect(() => {
    if (meData) setUser(meData);
    else if (!isLoadingMe) setUser(null);
  }, [meData, isLoadingMe]);

  useEffect(() => {
    refreshTwixtorToken().finally(() => setTokenRefreshReady(true));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      refreshTwixtorToken();
    }, 20 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);""",
    "Add proactive + periodic token refresh effects",
)

replace_once(
    CONTEXT_PATH,
    """      const res = await loginMutation.mutateAsync({ data });
      localStorage.setItem("twixtor_token", res.token);
      setUser(res.user);""",
    """      const res = await loginMutation.mutateAsync({ data });
      localStorage.setItem("twixtor_token", res.token);
      if ((res as any).refreshToken) localStorage.setItem("twixtor_refresh_token", (res as any).refreshToken);
      setUser(res.user);""",
    "Store refresh token on login",
)

replace_once(
    CONTEXT_PATH,
    """      const res = await registerMutation.mutateAsync({ data });
      localStorage.setItem("twixtor_token", res.token);
      setUser(res.user);""",
    """      const res = await registerMutation.mutateAsync({ data });
      localStorage.setItem("twixtor_token", res.token);
      if ((res as any).refreshToken) localStorage.setItem("twixtor_refresh_token", (res as any).refreshToken);
      setUser(res.user);""",
    "Store refresh token on register",
)

replace_once(
    CONTEXT_PATH,
    """    try { await logoutMutation.mutateAsync(); } catch {}
    localStorage.removeItem("twixtor_token");
    setUser(null);""",
    """    try { await logoutMutation.mutateAsync(); } catch {}
    localStorage.removeItem("twixtor_token");
    localStorage.removeItem("twixtor_refresh_token");
    setUser(null);""",
    "Clear refresh token on logout",
)

replace_once(
    UPLOADER_PATH,
    """import { Upload, X, Loader2, Music } from "lucide-react";
import { Button } from "@/components/ui/button";""",
    """import { Upload, X, Loader2, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { refreshTwixtorToken } from "@/lib/token-refresh";""",
    "Import refreshTwixtorToken helper into FileUploader",
)

replace_once(
    UPLOADER_PATH,
    """    try {
      const token = localStorage.getItem("twixtor_token");
      const endpoint = toMp3 ? "https://dramavers-production.up.railway.app/api/uploads/mp3" : "https://dramavers-production.up.railway.app/api/uploads";

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
    }""",
    """    const endpoint = toMp3 ? "https://dramavers-production.up.railway.app/api/uploads/mp3" : "https://dramavers-production.up.railway.app/api/uploads";
    const formData = new FormData();
    formData.append("file", file);

    const attemptUpload = (tok: string) => new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", endpoint);
      xhr.setRequestHeader("Authorization", `Bearer ${tok}`);
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
        } else if (xhr.status === 401) {
          reject({ unauthorized: true });
        } else {
          reject(new Error("Upload gagal: " + xhr.status));
        }
      };
      xhr.onerror = () => reject(new Error("Koneksi gagal"));
      xhr.send(formData);
    });

    try {
      const token = localStorage.getItem("twixtor_token") ?? "";
      try {
        await attemptUpload(token);
      } catch (err: any) {
        if (err?.unauthorized) {
          const freshToken = await refreshTwixtorToken();
          if (!freshToken) throw new Error("Sesi login habis. Silakan login ulang.");
          setProgress(0);
          await attemptUpload(freshToken);
        } else {
          throw err;
        }
      }
    } catch (err: any) {
      setError(err?.message ?? "Upload gagal. Coba lagi.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }""",
    "Add retry-with-fresh-token-on-401 logic to upload",
)

print("\nAll patches applied successfully.")
