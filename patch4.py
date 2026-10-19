path = "artifacts/twixtor-archive/src/pages/profile/index.tsx"
with open(path, encoding="utf-8") as f:
    content = f.read()

old = '''            {/* Stats */}
            <div className="flex justify-center md:justify-start gap-8 mt-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-white neon-text-blue">{u.totalDownloads || 0}</p>
                <p className="text-[10px] text-white/40 uppercase tracking-widest mt-0.5">Downloads</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-white neon-text-blue">{u.totalFavorites || 0}</p>
                <p className="text-[10px] text-white/40 uppercase tracking-widest mt-0.5">Favorites</p>
              </div>
              <Link href={`/users/${user.id}/following`} className="text-center group">
                <p className="text-2xl font-bold text-white neon-text-blue group-hover:opacity-80 transition-opacity">{u.followingCount ?? 0}</p>
                <p className="text-[10px] text-white/40 uppercase tracking-widest mt-0.5">Mengikuti</p>
              </Link>
              <div className="text-center">
                <p className="text-2xl font-bold text-white neon-text-blue">{u.followerCount ?? 0}</p>
                <p className="text-[10px] text-white/40 uppercase tracking-widest mt-0.5">Pengikut</p>
              </div>
            </div>'''

new = '''            {/* Stats */}
            <div className="grid grid-cols-4 gap-1 md:flex md:justify-start md:gap-8 mt-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-white neon-text-blue">{u.totalDownloads || 0}</p>
                <p className="text-[9px] md:text-[10px] text-white/40 uppercase tracking-tight md:tracking-widest mt-0.5 whitespace-nowrap">Downloads</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-white neon-text-blue">{u.totalFavorites || 0}</p>
                <p className="text-[9px] md:text-[10px] text-white/40 uppercase tracking-tight md:tracking-widest mt-0.5 whitespace-nowrap">Favorites</p>
              </div>
              <Link href={`/users/${user.id}/following`} className="text-center group">
                <p className="text-2xl font-bold text-white neon-text-blue group-hover:opacity-80 transition-opacity">{u.followingCount ?? 0}</p>
                <p className="text-[9px] md:text-[10px] text-white/40 uppercase tracking-tight md:tracking-widest mt-0.5 whitespace-nowrap">Mengikuti</p>
              </Link>
              <div className="text-center">
                <p className="text-2xl font-bold text-white neon-text-blue">{u.followerCount ?? 0}</p>
                <p className="text-[9px] md:text-[10px] text-white/40 uppercase tracking-tight md:tracking-widest mt-0.5 whitespace-nowrap">Pengikut</p>
              </div>
            </div>'''

count = content.count(old)
if count != 1:
    raise SystemExit(f"expected 1 match, found {count}")
content = content.replace(old, new, 1)
with open(path, "w", encoding="utf-8") as f:
    f.write(content)
print("[OK] stats grid mobile-friendly")
