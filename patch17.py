import re

path = "artifacts/twixtor-archive/src/pages/users/[id].tsx"
with open(path, encoding="utf-8") as f:
    content = f.read()

pattern1 = r'(Lock,\s*Heart)(\s*\}\s*from\s*"lucide-react";)'
new_content, n1 = re.subn(pattern1, r'\1, MessageCircle\2', content, count=1)
if n1 != 1:
    raise SystemExit(f"[FAIL] import MessageCircle: {n1} match")
print("[OK] import MessageCircle")

pattern2 = r'(\{isOwnProfile && \(\s*<Link href="/profile">)'
chat_button = '''{user && !isOwnProfile && (!profile.isPrivate || profile.isFriend) && (
                <Link href={`/messages/${profile.id}`}>
                  <Button variant="outline" className="border-white/20 text-white/80 hover:text-white hover:bg-white/8 ml-2">
                    <MessageCircle className="h-4 w-4 mr-2" /> Chat
                  </Button>
                </Link>
              )}
              \\1'''
new_content, n2 = re.subn(pattern2, chat_button, new_content, count=1)
if n2 != 1:
    raise SystemExit(f"[FAIL] tombol Chat: {n2} match")
print("[OK] tombol Chat")

with open(path, "w", encoding="utf-8") as f:
    f.write(new_content)

print("\nSelesai! Tombol Chat terpasang di profil.")
