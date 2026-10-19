import sys

def replace_once(path, old, new, label):
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    count = content.count(old)
    if count != 1:
        print(f"[FAIL] {label}: expected 1 match, found {count} in {path}")
        sys.exit(1)
    content = content.replace(old, new)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"[OK] {label}")

HOME_PATH = "artifacts/twixtor-archive/src/pages/home/index.tsx"

replace_once(
    HOME_PATH,
    """          <div className="flex items-center justify-between gap-3 -mt-2">
            {stats && (
              <BorderGlow
                glowColor="270 60 70"
                backgroundColor="transparent"
                borderRadius={14}
                glowRadius={20}
                glowIntensity={0.9}
                edgeSensitivity={22}
                coneSpread={30}
                colors={["#c084fc", "#f472b6", "#38bdf8"]}
                animated={true}
              >
                <div className="px-3 py-2.5 flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <Film className="h-3 w-3 text-white/30 flex-shrink-0" />
                    <Counter
                      value={stats.totalDramas}
                      places={[100, 10, 1]}
                      fontSize={15}
                      padding={2}
                      gap={1}
                      textColor="rgba(255,255,255,0.9)"
                      fontWeight={800}
                      gradientFrom="transparent"
                    />
                    <span className="text-[10px] text-white/25 uppercase tracking-wider">
                      Dramas
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Users className="h-3 w-3 text-white/30 flex-shrink-0" />
                    <Counter
                      value={stats.totalActors}
                      places={[100, 10, 1]}
                      fontSize={15}
                      padding={2}
                      gap={1}
                      textColor="rgba(255,255,255,0.9)"
                      fontWeight={800}
                      gradientFrom="transparent"
                    />
                    <span className="text-[10px] text-white/25 uppercase tracking-wider">
                      Aktor
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Play className="h-3 w-3 text-white/30 flex-shrink-0" />
                    <Counter
                      value={stats.totalVideos}
                      places={[100, 10, 1]}
                      fontSize={15}
                      padding={2}
                      gap={1}
                      textColor="rgba(255,255,255,0.9)"
                      fontWeight={800}
                      gradientFrom="transparent"
                    />
                    <span className="text-[10px] text-white/25 uppercase tracking-wider">
                      Clips
                    </span>
                  </div>
                </div>
              </BorderGlow>
            )}

            {featuredDramas.length >= 2 && (
              <div
                className="flex-shrink-0"
                style={{ width: 112, height: 158, position: "relative" }}
              >
                <CardSwap
                  width={100}
                  height={140}
                  cardDistance={22}
                  verticalDistance={28}
                  delay={4000}
                  pauseOnHover
                  skewAmount={4}
                  easing="elastic"
                  onCardClick={(i) => {
                    const drama = featuredDramas[i];
                    if (drama) {
                      setLocation(`/dramas/${drama.id}`);
                    }
                  }}
                >
                  {featuredDramas.slice(0, 4).map((drama: any) => (
                    <Card key={drama.id}>
                      {drama.posterUrl ? (
                        <img
                          src={drama.posterUrl}
                          alt={drama.name}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "12px",
                            gap: "6px",
                          }}
                        >
                          <Film style={{ width: 22, height: 22, color: "rgba(255,255,255,0.2)" }} />
                          <span
                            style={{
                              fontSize: 10,
                              color: "rgba(255,255,255,0.5)",
                              textAlign: "center",
                              lineHeight: 1.3,
                            }}
                          >
                            {drama.name}
                          </span>
                        </div>
                      )}
                    </Card>
                  ))}
                </CardSwap>
              </div>
            )}
          </div>""",
    """          <div className="flex items-center justify-between gap-3 -mt-2">
            {stats && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2.5 flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <Film className="h-3 w-3 text-white/30 flex-shrink-0" />
                  <span className="text-[15px] font-extrabold text-white/90">{stats.totalDramas}</span>
                  <span className="text-[10px] text-white/25 uppercase tracking-wider">Dramas</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-3 w-3 text-white/30 flex-shrink-0" />
                  <span className="text-[15px] font-extrabold text-white/90">{stats.totalActors}</span>
                  <span className="text-[10px] text-white/25 uppercase tracking-wider">Aktor</span>
                </div>
                <div className="flex items-center gap-2">
                  <Play className="h-3 w-3 text-white/30 flex-shrink-0" />
                  <span className="text-[15px] font-extrabold text-white/90">{stats.totalVideos}</span>
                  <span className="text-[10px] text-white/25 uppercase tracking-wider">Clips</span>
                </div>
              </div>
            )}

            {featuredDramas.length >= 2 && (
              <div className="flex-shrink-0 flex gap-1.5" style={{ width: 112, height: 158 }}>
                {featuredDramas.slice(0, 2).map((drama: any) => (
                  <button
                    key={drama.id}
                    type="button"
                    onClick={() => setLocation(`/dramas/${drama.id}`)}
                    className="flex-1 rounded-xl overflow-hidden border border-white/10 bg-black/40"
                  >
                    {drama.posterUrl ? (
                      <img
                        src={drama.posterUrl}
                        alt={drama.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-2 gap-1.5">
                        <Film className="h-5 w-5 text-white/20" />
                        <span className="text-[10px] text-white/50 text-center leading-tight">{drama.name}</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>""",
    "Replace animated BorderGlow+Counter+CardSwap hero with a lightweight static version",
)

print("\nAll patches applied successfully.")
