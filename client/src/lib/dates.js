// Client-side date helpers — "today" always comes from the user's timezone.

const ISO = /^\d{4}-\d{2}-\d{2}$/;

const dayFormatters = new Map();

function dayFormatter(timezone) {
  if (!dayFormatters.has(timezone)) {
    dayFormatters.set(
      timezone,
      new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }),
    );
  }
  return dayFormatters.get(timezone);
}

export function todayInTz(timezone) {
  try {
    return dayFormatter(timezone).format(new Date());
  } catch {
    return dayFormatter('UTC').format(new Date());
  }
}

export function browserTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

export function isValidIsoDate(value) {
  if (typeof value !== 'string' || !ISO.test(value)) return false;
  const d = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

function toUtcNoon(iso) {
  return new Date(`${iso}T12:00:00Z`);
}

export function addDays(iso, n) {
  const d = toUtcNoon(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function dayOfWeek(iso) {
  return toUtcNoon(iso).getUTCDay();
}

export function weekStart(iso) {
  const sinceMonday = (dayOfWeek(iso) + 6) % 7;
  return addDays(iso, -sinceMonday);
}

export function weekDays(iso) {
  const start = weekStart(iso);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function formatFriendly(iso, opts = {}) {
  if (!isValidIsoDate(iso)) return '';
  return toUtcNoon(iso).toLocaleDateString(undefined, {
    timeZone: 'UTC',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    ...opts,
  });
}

export function relativeDayLabel(iso, todayIso) {
  if (iso === todayIso) return 'Today';
  if (iso === addDays(todayIso, -1)) return 'Yesterday';
  if (iso === addDays(todayIso, 1)) return 'Tomorrow';
  return formatFriendly(iso, { weekday: undefined });
}

export const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const WEEKDAY_LETTER = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
