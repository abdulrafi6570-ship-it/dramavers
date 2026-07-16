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
    "artifacts/twixtor-archive/src/pages/profile/index.tsx",
    """  async function handlePrivacyToggle() {
    const newVal = !(u.isPrivate ?? false);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("twixtor_token")}`,
        },
        body: JSON.stringify({ isPrivate: newVal }),
      });
      if (!res.ok) throw new Error();
      qc.invalidateQueries({ queryKey: getGetMeQueryKey() });
      toast({ title: newVal ? "Akun diset privat 🔒" : "Akun diset publik 🌐" });
    } catch {
      toast({ title: "Gagal update privasi", variant: "destructive" });
    }
  }""",
    """  async function handlePrivacyToggle() {
    const newVal = !(u.isPrivate ?? false);
    // Update cache dulu supaya toggle langsung berubah
    qc.setQueryData(getGetMeQueryKey(), (old: any) => old ? { ...old, isPrivate: newVal } : old);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("twixtor_token")}`,
        },
        body: JSON.stringify({ isPrivate: newVal }),
      });
      if (!res.ok) throw new Error();
      toast({ title: newVal ? "Akun diset privat 🔒" : "Akun diset publik 🌐" });
    } catch {
      // Revert kalau gagal
      qc.setQueryData(getGetMeQueryKey(), (old: any) => old ? { ...old, isPrivate: !newVal } : old);
      toast({ title: "Gagal update privasi", variant: "destructive" });
    }
  }""",
    "fix handlePrivacyToggle pakai setQueryData supaya langsung update",
)

print("SELESAI!")
