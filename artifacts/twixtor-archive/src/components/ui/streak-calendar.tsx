import { cn } from "@/lib/utils";

export interface StreakPeriod {
  periodStart: string;
  periodEnd: string;
}

interface StreakCalendarProps {
  streak: StreakPeriod[];
  view?: "week";
  startOfWeek?: number;
  className?: string;
}

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

function toDateOnly(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function isDateInStreak(date: Date, streak: StreakPeriod[]) {
  const t = toDateOnly(date).getTime();
  return streak.some((p) => {
    const start = toDateOnly(new Date(`${p.periodStart}T00:00:00`)).getTime();
    const end = toDateOnly(new Date(`${p.periodEnd}T00:00:00`)).getTime();
    return t >= start && t <= end;
  });
}

export function StreakCalendar({ streak, startOfWeek = 1, className }: StreakCalendarProps) {
  const today = toDateOnly(new Date());
  const todayDow = today.getDay();
  const offset = (todayDow - startOfWeek + 7) % 7;
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - offset);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  return (
    <div className={cn("flex justify-between gap-1", className)}>
      {days.map((d, i) => {
        const active = isDateInStreak(d, streak);
        const isToday = d.getTime() === today.getTime();
        return (
          <div key={i} className="flex flex-col items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground uppercase">{DAY_LABELS[d.getDay()]}</span>
            <div
              className={cn(
                "h-8 w-8 rounded-lg flex items-center justify-center text-xs font-medium transition-colors",
                active ? "bg-primary text-black" : "bg-muted text-muted-foreground",
                isToday && !active && "ring-1 ring-primary/50",
                isToday && active && "ring-2 ring-primary/80"
              )}
            >
              {d.getDate()}
            </div>
          </div>
        );
      })}
    </div>
  );
}
