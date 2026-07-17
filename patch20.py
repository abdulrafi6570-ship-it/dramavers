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
    "artifacts/twixtor-archive/src/pages/messages/[userId].tsx",
    'import { useState, useEffect, useRef } from "react";\nimport { useParams, Link } from "wouter";\nimport { Navbar } from "@/components/layout/Navbar";\nimport { ArrowLeft, Send, Lock } from "lucide-react";',
    'import { useState, useEffect, useRef } from "react";\nimport { useParams, Link } from "wouter";\nimport { Navbar } from "@/components/layout/Navbar";\nimport { ArrowLeft, Send, Lock } from "lucide-react";\nimport { useAuth } from "@/contexts/AuthContext";',
    "import useAuth",
)

replace_once(
    "artifacts/twixtor-archive/src/pages/messages/[userId].tsx",
    'export default function ChatThread() {\n  const { userId } = useParams<{ userId: string }>();',
    'export default function ChatThread() {\n  const { userId } = useParams<{ userId: string }>();\n  const { user } = useAuth();',
    "panggil useAuth di komponen",
)

replace_once(
    "artifacts/twixtor-archive/src/pages/messages/[userId].tsx",
    '  const [partnerName, setPartnerName] = useState<string>("");',
    '  const [partnerName, setPartnerName] = useState<string>("");\n  const [partnerPhoto, setPartnerPhoto] = useState<string | null>(null);',
    "state partnerPhoto",
)

replace_once(
    "artifacts/twixtor-archive/src/pages/messages/[userId].tsx",
    '      if (profRes.ok) {\n        const prof = await profRes.json();\n        setPartnerName(prof.username);\n      }',
    '      if (profRes.ok) {\n        const prof = await profRes.json();\n        setPartnerName(prof.username);\n        setPartnerPhoto(prof.photoUrl ?? null);\n      }',
    "simpan partnerPhoto",
)

replace_once(
    "artifacts/twixtor-archive/src/pages/messages/[userId].tsx",
    '''        <div className="flex items-center gap-3 mb-4">
          <Link href="/messages" className="text-white/60 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-heading text-lg text-white">@{partnerName || "..."}</h1>
        </div>''',
    '''        <div className="flex items-center gap-3 mb-4">
          <Link href="/messages" className="text-white/60 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="w-9 h-9 rounded-full overflow-hidden glass-panel-strong flex items-center justify-center text-sm font-bold text-white shrink-0">
            {partnerPhoto
              ? <img src={partnerPhoto} className="w-full h-full object-cover" alt={partnerName} />
              : partnerName.charAt(0).toUpperCase()}
          </div>
          <h1 className="font-heading text-lg text-white">@{partnerName || "..."}</h1>
        </div>''',
    "tambah avatar di header chat",
)

replace_once(
    "artifacts/twixtor-archive/src/pages/messages/[userId].tsx",
    '''              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.isMine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${
                      m.isMine
                        ? "bg-primary text-white rounded-br-sm"
                        : "glass-panel text-white/90 rounded-bl-sm"
                    }`}
                  >
                    {m.message}
                  </div>
                </div>
              ))}''',
    '''              {messages.map((m) => {
                const mine = user ? m.senderId === user.id : m.isMine;
                return (
                  <div key={m.id} className={`flex items-end gap-2 ${mine ? "justify-end" : "justify-start"}`}>
                    {!mine && (
                      <div className="w-6 h-6 rounded-full overflow-hidden glass-panel-strong flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                        {partnerPhoto
                          ? <img src={partnerPhoto} className="w-full h-full object-cover" alt={partnerName} />
                          : partnerName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div
                      className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${
                        mine
                          ? "bg-primary text-white rounded-br-sm"
                          : "glass-panel text-white/90 rounded-bl-sm"
                      }`}
                    >
                      {m.message}
                    </div>
                  </div>
                );
              })}''',
    "fix isMine pakai user login langsung + avatar di bubble lawan chat",
)

print("\nSelesai! Chat: kiri-kanan fixed, avatar muncul.")
