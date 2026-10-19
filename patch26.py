import re

PROFILE = "artifacts/twixtor-archive/src/pages/profile/index.tsx"
USER_PROFILE = "artifacts/twixtor-archive/src/pages/users/[id].tsx"

def fix_avatar_block(path, obj_var, state_name, setter_name, name_field, label):
    with open(path, encoding="utf-8") as f:
        content = f.read()

    if state_name not in content:
        m = re.search(r"(const \[\w+, set\w+\] = useState[^\n]*\n)", content)
        if not m:
            raise SystemExit(f"[FAIL] {label}: gak nemu tempat nyisipin state useState")
        insert_at = m.end()
        content = (
            content[:insert_at]
            + f"  const [{state_name}, {setter_name}] = useState(false);\n"
            + content[insert_at:]
        )
        print(f"[OK] tambah state {state_name} ({label})")
    else:
        print(f"[SKIP] state {state_name} udah ada ({label})")

    pattern = re.compile(
        r"\{" + re.escape(obj_var) + r"\.photoUrl.*?\n(\s*)</div>",
        re.DOTALL,
    )
    matches = list(pattern.finditer(content))
    if len(matches) != 1:
        raise SystemExit(f"[FAIL] {label}: expected 1 match, found {len(matches)} in {path}")

    indent = matches[0].group(1)
    new_block = (
        f"{{{obj_var}.photoUrl && !{state_name}\n"
        f"                ? (\n"
        f"                  <img\n"
        f"                    src={{{obj_var}.photoUrl}}\n"
        f"                    alt={{{name_field}}}\n"
        f'                    className="w-full h-full object-cover"\n'
        f"                    onError={{() => {setter_name}(true)}}\n"
        f"                  />\n"
        f"                )\n"
        f"                : {name_field}.charAt(0).toUpperCase()\n"
        f"              }}\n"
        f"{indent}</div>"
    )
    content = content[: matches[0].start()] + new_block + content[matches[0].end():]

    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"[OK] fix avatar render block ({label})")


fix_avatar_block(
    PROFILE, "u", "avatarBroken", "setAvatarBroken", "user.username",
    "profile sendiri",
)
fix_avatar_block(
    USER_PROFILE, "profile", "profileAvatarBroken", "setProfileAvatarBroken", "profile.username",
    "profile orang lain",
)

print("\nSelesai patch26.")
