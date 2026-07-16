def replace_once(path, old, new, label):
    with open(path, encoding="utf-8") as f:
        content = f.read()
    count = content.count(old)
    if count != 1:
        raise SystemExit(f"[FAIL] {label}: expected 1, found {count} in {path}")
    content = content.replace(old, new, 1)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"[OK] {label}")

PROFILE = "artifacts/twixtor-archive/src/pages/users/[id].tsx"

replace_once(
    PROFILE,
    '''export default function UserProfile() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`/api/users/${id}`, {
        headers: user ? { Authorization: `Bearer ${localStorage.getItem("twixtor_token")}` } : {},
      });
      if (!res.ok) throw new Error("User not found");
      setProfile(await res.json());
    } catch {
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchProfile(); }, [id, user]);''',
    '''export default function UserProfile() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const fetchProfile = async (isRetry = false) => {
    if (!isRetry) {
      setIsLoading(true);
      setNotFound(false);
      setLoadError(false);
    }
    try {
      const res = await fetch(`/api/users/${id}`, {
        headers: user ? { Authorization: `Bearer ${localStorage.getItem("twixtor_token")}` } : {},
      });

      if (res.status === 404) {
        setProfile(null);
        setNotFound(true);
        setIsLoading(false);
        return;
      }

      if (!res.ok) throw new Error(`Request failed: ${res.status}`);

      const json = await res.json();
      setProfile(json);
      setNotFound(false);
      setLoadError(false);
      setIsLoading(false);
    } catch {
      if (!isRetry) {
        setTimeout(() => fetchProfile(true), 1200);
        return;
      }
      setProfile(null);
      setLoadError(true);
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchProfile(); }, [id, user]);''',
    "bedain 404 asli vs error transient + tambah auto-retry di UserProfile",
)

replace_once(
    PROFILE,
    '''  if (!profile) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <main className="container mx-auto px-4 md:px-6 py-8 max-w-2xl">
          <Link href="/" className="inline-flex items-center gap-2 text-white/40 hover:text-white mb-6 transition-colors text-sm">
            <ArrowLeft className="h-4 w-4" /> Kembali
          </Link>
          <div className="glass-panel rounded-2xl p-12 text-center border border-white/8">
            <p className="text-white/40">Pengguna tidak ditemukan</p>
          </div>
        </main>
      </div>
    );
  }''',
    '''  if (!profile) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <main className="container mx-auto px-4 md:px-6 py-8 max-w-2xl">
          <Link href="/" className="inline-flex items-center gap-2 text-white/40 hover:text-white mb-6 transition-colors text-sm">
            <ArrowLeft className="h-4 w-4" /> Kembali
          </Link>
          <div className="glass-panel rounded-2xl p-12 text-center border border-white/8">
            {notFound ? (
              <p className="text-white/40">Pengguna tidak ditemukan</p>
            ) : (
              <>
                <p className="text-white/40 mb-4">Gagal memuat profil. Coba lagi sebentar.</p>
                <Button
                  variant="outline"
                  className="border-white/15 text-white/60 hover:text-white hover:bg-white/8"
                  onClick={() => fetchProfile()}
                >
                  Coba Lagi
                </Button>
              </>
            )}
          </div>
        </main>
      </div>
    );
  }''',
    "tampilkan tombol 'Coba Lagi' saat error transient, bukan 'tidak ditemukan'",
)

print("\nSelesai patch fix bug 'Pengguna tidak ditemukan' palsu.")
