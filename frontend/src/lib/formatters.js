export function formatEstimatedMinutes(minutes) {
  if (minutes === 60) {
    return '1 hr';
  }

  return `${minutes} min`;
}

export function formatTodayLabel() {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  }).format(new Date());
}
