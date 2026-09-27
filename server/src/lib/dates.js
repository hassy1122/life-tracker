// Timezone-aware date helpers. Every "today" in the app is computed from the
// user's stored timezone, never the server's clock zone.

const ISO = /^\d{4}-\d{2}-\d{2}$/;

export function isValidIsoDate(value) {
  if (typeof value !== 'string' || !ISO.test(value)) return false;
  const d = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

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

/** Today's date (YYYY-MM-DD) in the given IANA timezone. */
export function todayInTz(timezone) {
  try {
    return dayFormatter(timezone).format(new Date());
  } catch {
    return dayFormatter('UTC').format(new Date());
  }
}

function toUtcNoon(iso) {
  return new Date(`${iso}T12:00:00Z`);
}

function fromUtc(d) {
  return d.toISOString().slice(0, 10);
}

export function addDays(iso, n) {
  const d = toUtcNoon(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return fromUtc(d);
}

/** Day of week for an ISO date: 0 = Sunday … 6 = Saturday. */
export function dayOfWeek(iso) {
  return toUtcNoon(iso).getUTCDay();
}

/** Monday of the week containing `iso`. */
export function weekStart(iso) {
  const dow = dayOfWeek(iso);
  const sinceMonday = (dow + 6) % 7;
  return addDays(iso, -sinceMonday);
}

/** All 7 ISO dates of the week containing `iso` (Monday first). */
export function weekDays(iso) {
  const start = weekStart(iso);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function compareDates(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}
