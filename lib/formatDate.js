// Format singkat "3 Sep 2026, 14.20" dipakai di komentar & list umum
export function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function formatTime(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

export function formatDayLabel(dateStr) {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const sameDay = (a, b) => a.toDateString() === b.toDateString();

  if (sameDay(d, today)) return 'Hari ini';
  if (sameDay(d, yesterday)) return 'Kemarin';
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

// Kelompokkan pesan berdasarkan tanggal, seperti pembatas tanggal di WhatsApp
export function groupMessagesByDay(messages) {
  const groups = [];
  let currentDay = null;
  let currentList = null;

  for (const msg of messages) {
    const dayLabel = formatDayLabel(msg.created_at);
    if (dayLabel !== currentDay) {
      currentDay = dayLabel;
      currentList = [];
      groups.push({ day: dayLabel, messages: currentList });
    }
    currentList.push(msg);
  }
  return groups;
}
