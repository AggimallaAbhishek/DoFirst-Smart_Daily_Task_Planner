function toLocalDateKey(date) {
  const timezoneOffsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - timezoneOffsetMs).toISOString().slice(0, 10);
}

export function getTodayDateKey() {
  return toLocalDateKey(new Date());
}

export function shiftDate(dateKey, offsetDays) {
  const current = new Date(`${dateKey}T00:00:00`);
  current.setDate(current.getDate() + offsetDays);
  return toLocalDateKey(current);
}

export function formatBoardDate(dateKey) {
  const target = new Date(`${dateKey}T00:00:00`);

  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  }).format(target);
}

export function buildDateWindow(centerDateKey, radius = 3) {
  const days = [];
  const todayKey = getTodayDateKey();

  for (let offset = -radius; offset <= radius; offset += 1) {
    const key = shiftDate(centerDateKey, offset);
    days.push({
      key,
      label: formatBoardDate(key),
      isToday: key === todayKey
    });
  }

  return days;
}
