def replace_once(path, old, new, label):
    with open(path, encoding="utf-8") as f:
        content = f.read()
    count = content.count(old)
    if count != 1:
        raise SystemExit(f"[FAIL] {label}: expected 1 match, found {count} in {path}")
    content = content.replace(old, new, 1)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"[OK] {label}")

PROFILE = "artifacts/twixtor-archive/src/pages/profile/index.tsx"
USER_PROFILE = "artifacts/twixtor-archive/src/pages/users/[id].tsx"

replace_once(
    PROFILE,
    '  const [uploading, setUploading] = useState(false);',
    '  const [uploading, setUploading] = useState(false);\n'
    '  const [avatarBroken, setAvatarBroken] = useState(false);',
    "tambah state avatarBroken (profile sendiri)",
)

replace_once(
    PROFILE,
    '''              {u.photoUrl
                ? <img src={u.photoUrl} alt={user.username} className="w-full h-full object-cover" />
                : user.username.charAt(0).toUpperCase()
              }''',
    '''              {u.photoUrl && !avatarBroken
                ? (
                  <img
                    src={u.photoUrl}
                    alt={user.username}
                    className="w-full h-full object-cover"
                    onError={() => setAvatarBroken(true)}
                  />
                )
                : user.username.charAt(0).toUpperCase()
              }''',
    "fallback inisial saat foto profil sendiri broken",
)

replace_once(
    USER_PROFILE,
    '  const [profile, setProfile] = useState<PublicProfile | null>(null);',
    '  const [profile, setProfile] = useState<PublicProfile | null>(null);\n'
    '  const [profileAvatarBroken, setProfileAvatarBroken] = useState(false);',
    "tambah state profileAvatarBroken (profile orang lain)",
)

replace_once(
    USER_PROFILE,
    '''              {profile.photoUrl
                ? <img src={profile.photoUrl} alt={profile.username} className="w-full h-full object-cover" />
                : profile.username.charAt(0).toUpperCase()
              }''',
    '''              {profile.photoUrl && !profileAvatarBroken
                ? (
                  <img
                    src={profile.photoUrl}
                    alt={profile.username}
                    className="w-full h-full object-cover"
                    onError={() => setProfileAvatarBroken(true)}
                  />
                )
                : profile.username.charAt(0).toUpperCase()
              }''',
    "fallback inisial saat foto profil orang lain broken",
)

print("\nSelesai patch25.")
