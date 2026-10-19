import re

def regex_replace_once(path, pattern, new, label):
    with open(path, encoding="utf-8") as f:
        content = f.read()
    matches = list(pattern.finditer(content))
    if len(matches) != 1:
        raise SystemExit(f"[FAIL] {label}: expected 1 match, found {len(matches)} in {path}")
    start, end = matches[0].span()
    content = content[:start] + new + content[end:]
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"[OK] {label}")

PROFILE = "artifacts/twixtor-archive/src/pages/profile/index.tsx"
USER_PROFILE = "artifacts/twixtor-archive/src/pages/users/[id].tsx"

pattern1 = re.compile(
    r"\{u\.photoUrl\s*"
    r"\?\s*<img src=\{u\.photoUrl\}\s*alt=\{user\.username\}\s*className=\"w-full h-full object-cover\"\s*/>\s*"
    r":\s*user\.username\.charAt\(0\)\.toUpperCase\(\)\s*"
    r"\}",
    re.DOTALL,
)
new1 = (
    "{u.photoUrl\n"
    "              ? (\n"
    "                <img\n"
    "                  src={u.photoUrl}\n"
    "                  alt={user.username}\n"
    "                  className=\"w-full h-full object-cover\"\n"
    "                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = \"none\"; }}\n"
    "                />\n"
    "              )\n"
    "              : null\n"
    "            }\n"
    "            {!u.photoUrl && <span>{user.username.charAt(0).toUpperCase()}</span>}"
)
regex_replace_once(PROFILE, pattern1, new1, "fallback inisial saat foto profil sendiri broken")

pattern2 = re.compile(
    r"\{profile\.photoUrl\s*"
    r"\?\s*<img src=\{profile\.photoUrl\}\s*alt=\{profile\.username\}\s*className=\"w-full h-full object-cover\"\s*/>\s*"
    r":\s*profile\.username\.charAt\(0\)\.toUpperCase\(\)\s*"
    r"\}",
    re.DOTALL,
)
new2 = (
    "{profile.photoUrl\n"
    "                ? (\n"
    "                  <img\n"
    "                    src={profile.photoUrl}\n"
    "                    alt={profile.username}\n"
    "                    className=\"w-full h-full object-cover\"\n"
    "                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = \"none\"; }}\n"
    "                  />\n"
    "                )\n"
    "                : null}\n"
    "              {!profile.photoUrl && <span>{profile.username.charAt(0).toUpperCase()}</span>}"
)
regex_replace_once(USER_PROFILE, pattern2, new2, "fallback inisial saat foto profil orang lain broken")

print("\nSelesai patch fallback avatar broken image.")
print("Catatan: ini cuma benerin TAMPILAN. Foto lama yang udah 404 tetap perlu di-upload ulang lewat tombol kamera.")
