import { parse, format } from 'date-fns';

// Parse time string in format dd-MM-yyyy HH:mm:ss
export function parseTime(timeStr: string): Date {
  try {
    return parse(timeStr, 'dd-MM-yyyy HH:mm:ss', new Date());
  } catch (error) {
    console.warn('Failed to parse time:', timeStr);
    return new Date(); // fallback to current time
  }
}

// Format time for display
export function formatTime(date: Date): string {
  return format(date, 'dd-MM-yyyy HH:mm:ss');
}

// Get relative time (e.g., "2 hours ago")
export function getRelativeTime(timeStr: string): string {
  const date = parseTime(timeStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  } else if (diffHours > 0) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  } else {
    const diffMins = Math.floor(diffMs / (1000 * 60));
    return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  }
}