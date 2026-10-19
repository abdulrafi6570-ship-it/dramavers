// Judul halaman admin: ikon amber + judul + subjudul + tombol aksi (opsional)
export default function PageHeader({ icon: Icon, title, subtitle, action }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        {Icon && (
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#fff4dc] text-[#b45309]">
            <Icon size={20} strokeWidth={2.2} />
          </span>
        )}

        <div className="min-w-0">
          <h1 className="truncate text-xl font-black tracking-tight sm:text-2xl">
            {title}
          </h1>

          {subtitle && (
            <p className="mt-0.5 text-xs text-[#777770] sm:text-sm">{subtitle}</p>
          )}
        </div>
      </div>

      {action}
    </div>
  );
}