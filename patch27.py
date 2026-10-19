import re

PROFILE = "artifacts/twixtor-archive/src/pages/profile/index.tsx"
MSG_INDEX = "artifacts/twixtor-archive/src/pages/messages/index.tsx"
MSG_THREAD = "artifacts/twixtor-archive/src/pages/messages/[userId].tsx"

def fix_profile(path):
    with open(path, encoding="utf-8") as f:
        content = f.read()
    changed = False
    if "useEffect" not in content:
        content = content.replace("import { useState,", "import { useState, useEffect,", 1)
        print("[OK] tambah useEffect ke import (profile)")
        changed = True
    else:
        print("[SKIP] useEffect sudah ada (profile)")
    marker = "const u = user as any;"
    if marker in content and "setAvatarBroken(false);" not in content:
        insert = marker + "\n\n  useEffect(() => {\n    setAvatarBroken(false);\n  }, [u.photoUrl]);"
        content = content.replace(marker, insert, 1)
        print("[OK] sisip useEffect reset avatarBroken (profile)")
        changed = True
    elif "setAvatarBroken(false);" in content:
        print("[SKIP] useEffect reset sudah ada (profile)")
    else:
        print("[WARN] marker const u tidak ditemukan (profile)")
    m = re.search(r"(if \(!res\.ok\)[^\n]+\n\s*)(await res\.json\(\);)(\s*\n\s*qc\.invalidateQueries)", content)
    if m:
        rep = (m.group(1) + "const data = await res.json();\n      if (data.user) {\n        qc.setQueryData(getGetMeQueryKey(), data.user);\n      }\n      setAvatarBroken(false);" + m.group(3))
        content = content.replace(m.group(0), rep, 1)
        print("[OK] fix handlePhotoUpload (profile)")
        changed = True
    else:
        print("[SKIP] handlePhotoUpload sudah benar atau polanya beda (profile)")
    if changed:
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)

def fix_messages_index(path):
    with open(path, encoding="utf-8") as f:
        content = f.read()
    changed = False
    if "brokenPhotos" not in content:
        m = re.search(r"(const \[loading, setLoading\] = useState[^\n]+\n)", content)
        if m:
            content = content.replace(m.group(1), m.group(1) + "  const [brokenPhotos, setBrokenPhotos] = useState(new Set());\n", 1)
            print("[OK] tambah state brokenPhotos (messages/index)")
            changed = True
        else:
            print("[WARN] tidak ketemu tempat untuk state brokenPhotos (messages/index)")
    else:
        print("[SKIP] brokenPhotos sudah ada (messages/index)")
    def add_on_error(m):
        tag, close = m.group(1), m.group(2)
        if "onError" in tag:
            return m.group(0)
        return tag + "\n                        onError={() => setBrokenPhotos((prev) => { const s = new Set(prev); s.add(c.userId); return s; })}" + close
    img_re = re.compile(r'(<img\s[^>]*src=\{[^}]*[Pp]hoto[^}]*\}[^>]*?)(\s*/>)', re.DOTALL)
    nc = img_re.sub(add_on_error, content)
    if nc != content:
        content = nc
        print("[OK] tambah onError ke img (messages/index)")
        changed = True
    else:
        print("[SKIP] onError sudah ada atau img tidak ditemukan (messages/index)")
    if "c.photoUrl &&" in content and "brokenPhotos.has" not in content:
        content = content.replace("c.photoUrl &&", "c.photoUrl && !brokenPhotos.has(c.userId) &&", 1)
        print("[OK] ubah kondisi render foto (messages/index)")
        changed = True
    else:
        print("[SKIP] kondisi render foto sudah benar (messages/index)")
    if changed:
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)

def fix_messages_thread(path):
    with open(path, encoding="utf-8") as f:
        content = f.read()
    changed = False
    if "partnerPhotoBroken" not in content:
        m = re.search(r"(const \[partnerPhoto, setPartnerPhoto\] = useState[^\n]+\n)", content)
        if not m:
            m = re.search(r"(const \[partnerName, setPartnerName\] = useState[^\n]+\n)", content)
        if m:
            content = content.replace(m.group(1), m.group(1) + "  const [partnerPhotoBroken, setPartnerPhotoBroken] = useState(false);\n", 1)
            print("[OK] tambah state partnerPhotoBroken (messages/thread)")
            changed = True
        else:
            print("[WARN] tidak ketemu tempat state partnerPhotoBroken (messages/thread)")
    else:
        print("[SKIP] partnerPhotoBroken sudah ada (messages/thread)")
    sm = "const [partnerPhotoBroken, setPartnerPhotoBroken] = useState(false);"
    if sm in content and "setPartnerPhotoBroken(false);" not in content:
        insert = sm + "\n\n  useEffect(() => {\n    setPartnerPhotoBroken(false);\n  }, [partnerPhoto]);"
        content = content.replace(sm, insert, 1)
        print("[OK] sisip useEffect reset partnerPhotoBroken (messages/thread)")
        changed = True
    elif "setPartnerPhotoBroken(false);" in content:
        print("[SKIP] useEffect reset sudah ada (messages/thread)")
    else:
        print("[WARN] state partnerPhotoBroken belum ada, jalankan lagi (messages/thread)")
    if "useEffect" not in content:
        content = re.sub(r"(import \{[^}]+)(} from ['\"]react['\"])", lambda m: m.group(1) + ", useEffect" + m.group(2) if "useEffect" not in m.group(1) else m.group(0), content, count=1)
        print("[OK] tambah useEffect ke import (messages/thread)")
        changed = True
    else:
        print("[SKIP] useEffect sudah ada di import (messages/thread)")
    def add_partner_on_error(m):
        tag, close = m.group(1), m.group(2)
        if "onError" in tag:
            return m.group(0)
        return tag + "\n              onError={() => setPartnerPhotoBroken(true)}" + close
    img_re2 = re.compile(r'(<img\s[^>]*src=\{[^}]*[Pp]artner[Pp]hoto[^}]*\}[^>]*?)(\s*/>)', re.DOTALL)
    nc2 = img_re2.sub(add_partner_on_error, content)
    if nc2 != content:
        content = nc2
        print("[OK] tambah onError ke img partnerPhoto (messages/thread)")
        changed = True
    else:
        print("[SKIP] onError sudah ada atau img tidak ditemukan (messages/thread)")
    if "partnerPhoto &&" in content and "partnerPhotoBroken" not in content.split("partnerPhoto &&")[1][:30]:
        content = content.replace("partnerPhoto &&", "partnerPhoto && !partnerPhotoBroken &&", 1)
        print("[OK] ubah kondisi render partnerPhoto (messages/thread)")
        changed = True
    else:
        print("[SKIP] kondisi render partnerPhoto sudah benar (messages/thread)")
    if changed:
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)

fix_profile(PROFILE)
fix_messages_index(MSG_INDEX)
fix_messages_thread(MSG_THREAD)
print("\nSelesai patch27.")
