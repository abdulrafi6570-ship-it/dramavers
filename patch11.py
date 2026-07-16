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

replace_once(
    "artifacts/twixtor-archive/src/pages/users/[id].tsx",
    """  const handleFollow = async () => {
    if (!user) return;
    setFollowLoading(true);
    const method = profile?.isFollowing ? "DELETE" : "POST";
    try {
      const res = await fetch(`/api/users/${id}/follow`, {
        method,
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (!res.ok) throw new Error();
      await fetchProfile();
      toast({ title: profile?.isFollowing ? "Berhenti mengikuti" : "Mengikuti!" });
    } catch {
      toast({ title: "Gagal", variant: "destructive" });
    } finally {
      setFollowLoading(false);
    }
  };""",
    """  const handleFollow = async () => {
    if (!user || !profile) return;
    setFollowLoading(true);
    const wasFollowing = profile.isFollowing;
    const method = wasFollowing ? "DELETE" : "POST";
    try {
      const res = await fetch(`/api/users/${id}/follow`, {
        method,
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (!res.ok) throw new Error();
      const newIsFollowing = !wasFollowing;
      const newIsFriend = newIsFollowing && profile.isFollowedByThem;
      setProfile((p) => p ? {
        ...p,
        isFollowing: newIsFollowing,
        isFriend: newIsFriend,
        followerCount: p.followerCount + (newIsFollowing ? 1 : -1),
      } : p);
      toast({ title: wasFollowing ? "Berhenti mengikuti" : "Mengikuti!" });
    } catch {
      toast({ title: "Gagal", variant: "destructive" });
    } finally {
      setFollowLoading(false);
    }
  };""",
    "fix handleFollow update lokal",
)

print("SELESAI!")
