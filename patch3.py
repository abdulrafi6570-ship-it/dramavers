SETTINGS = "artifacts/twixtor-archive/src/pages/admin/settings.tsx"
MODAL = "artifacts/twixtor-archive/src/components/DonationModal.tsx"

def replace_once(path, old, new, label):
    with open(path, encoding="utf-8") as f:
        content = f.read()
    count = content.count(old)
    if count != 1:
        raise SystemExit(f"[FAIL] {label}: expected 1 match in {path}, found {count}")
    content = content.replace(old, new, 1)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"[OK] {label}")

replace_once(
    SETTINGS,
    '  const [danaNumber, setDanaNumber] = useState("");\n  const [gopayNumber, setGopayNumber] = useState("");',
    '  const [danaNumber, setDanaNumber] = useState("");\n  const [danaName, setDanaName] = useState("");\n  const [gopayNumber, setGopayNumber] = useState("");\n  const [gopayName, setGopayName] = useState("");',
    "state danaName & gopayName",
)

replace_once(
    SETTINGS,
    '        const keys = ["bgm_url", "bgm_enabled", "dana_number", "gopay_number", "saweria_url", "donation_qr_url"];',
    '        const keys = ["bgm_url", "bgm_enabled", "dana_number", "dana_name", "gopay_number", "gopay_name", "saweria_url", "donation_qr_url"];',
    "tambah key dana_name & gopay_name ke fetch list",
)

replace_once(
    SETTINGS,
    '''        if (results[2]?.value) setDanaNumber(results[2].value);
        if (results[3]?.value) setGopayNumber(results[3].value);
        if (results[4]?.value) setSaweriaUrl(results[4].value);
        if (results[5]?.value) setDonationQrUrl(results[5].value);''',
    '''        if (results[2]?.value) setDanaNumber(results[2].value);
        if (results[3]?.value) setDanaName(results[3].value);
        if (results[4]?.value) setGopayNumber(results[4].value);
        if (results[5]?.value) setGopayName(results[5].value);
        if (results[6]?.value) setSaweriaUrl(results[6].value);
        if (results[7]?.value) setDonationQrUrl(results[7].value);''',
    "map hasil fetch index geser karena 2 key baru",
)

replace_once(
    SETTINGS,
    '''        saveSetting("dana_number", danaNumber),
        saveSetting("gopay_number", gopayNumber),''',
    '''        saveSetting("dana_number", danaNumber),
        saveSetting("dana_name", danaName),
        saveSetting("gopay_number", gopayNumber),
        saveSetting("gopay_name", gopayName),''',
    "saveSetting dana_name & gopay_name",
)

replace_once(
    SETTINGS,
    '''                <div className="space-y-1.5">
                  <label className="text-xs text-white/50 flex items-center gap-1.5">
                    <span className="text-base">💙</span> Nomor DANA
                  </label>
                  <Input
                    value={danaNumber}
                    onChange={(e) => setDanaNumber(e.target.value)}
                    placeholder="08xxxxxxxxxx"
                    className="bg-white/5 border-white/10 text-white h-10 text-sm font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-white/50 flex items-center gap-1.5">
                    <span className="text-base">💚</span> Nomor GoPay
                  </label>
                  <Input
                    value={gopayNumber}
                    onChange={(e) => setGopayNumber(e.target.value)}
                    placeholder="08xxxxxxxxxx"
                    className="bg-white/5 border-white/10 text-white h-10 text-sm font-mono"
                  />
                </div>''',
    '''                <div className="space-y-1.5">
                  <label className="text-xs text-white/50 flex items-center gap-1.5">
                    <span className="text-base">💙</span> Nomor DANA
                  </label>
                  <Input
                    value={danaNumber}
                    onChange={(e) => setDanaNumber(e.target.value)}
                    placeholder="08xxxxxxxxxx"
                    className="bg-white/5 border-white/10 text-white h-10 text-sm font-mono"
                  />
                  <Input
                    value={danaName}
                    onChange={(e) => setDanaName(e.target.value)}
                    placeholder="Atas nama (a/n)"
                    className="bg-white/5 border-white/10 text-white h-10 text-sm mt-1.5"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-white/50 flex items-center gap-1.5">
                    <span className="text-base">💚</span> Nomor GoPay
                  </label>
                  <Input
                    value={gopayNumber}
                    onChange={(e) => setGopayNumber(e.target.value)}
                    placeholder="08xxxxxxxxxx"
                    className="bg-white/5 border-white/10 text-white h-10 text-sm font-mono"
                  />
                  <Input
                    value={gopayName}
                    onChange={(e) => setGopayName(e.target.value)}
                    placeholder="Atas nama (a/n)"
                    className="bg-white/5 border-white/10 text-white h-10 text-sm mt-1.5"
                  />
                </div>''',
    "input field nama a/n di UI admin",
)

replace_once(
    MODAL,
    '''  dana_number: string;
  gopay_number: string;''',
    '''  dana_number: string;
  dana_name: string;
  gopay_number: string;
  gopay_name: string;''',
    "tambah type dana_name & gopay_name",
)

replace_once(
    MODAL,
    '''  dana_number: "",
  gopay_number: "",''',
    '''  dana_number: "",
  dana_name: "",
  gopay_number: "",
  gopay_name: "",''',
    "default value dana_name & gopay_name",
)

replace_once(
    MODAL,
    '''        const keys = ["dana_number", "gopay_number", "saweria_url", "donation_qr_url"];''',
    '''        const keys = ["dana_number", "dana_name", "gopay_number", "gopay_name", "saweria_url", "donation_qr_url"];''',
    "tambah key dana_name & gopay_name ke fetch modal",
)

replace_once(
    MODAL,
    '''    accountLabel?: string;''',
    '''    accountLabel?: string;
    accountName?: string;''',
    "tambah field accountName di interface DonationMethod",
)

replace_once(
    MODAL,
    '''      account: settings.dana_number || "Belum diset",
      accountLabel: "No. HP DANA",''',
    '''      account: settings.dana_number || "Belum diset",
      accountLabel: "No. HP DANA",
      accountName: settings.dana_name,''',
    "pasang dana_name ke METHODS",
)

replace_once(
    MODAL,
    '''      account: settings.gopay_number || "Belum diset",
      accountLabel: "No. HP GoPay",''',
    '''      account: settings.gopay_number || "Belum diset",
      accountLabel: "No. HP GoPay",
      accountName: settings.gopay_name,''',
    "pasang gopay_name ke METHODS",
)

replace_once(
    MODAL,
    '''                        <p className="text-xs text-white/30 mt-2">a/n Twixtor Archive</p>''',
    '''                        <p className="text-xs text-white/30 mt-2">a/n {active.accountName || "Twixtor Archive"}</p>''',
    "ganti a/n hardcode jadi dinamis per Dana/GoPay",
)

print("\nSelesai patch nama akun DANA & GoPay.")
