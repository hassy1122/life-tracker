// Streak & progress rules — the core mechanic.
//
// Policy decisions (documented so they stay consistent):
//  * No grace days: one missed scheduled day ends a daily streak.
//  * Today is always "still open": if today isn't logged yet, the streak counts
//    up to yesterday and is only broken once the day fully ends.
//  * x_per_week habits streak in weeks (Monday-start): a week qualifies when
//    the target is met. The current in-progress week extends the streak only
//    once the target is met, and never breaks it before the week ends.
//  * Stats are recomputed on write (log added/changed), not on every read.

import { addDays, dayOfWeek, weekStart } from './dates.js';

const MAX_SCAN_DAYS = 1095; // ~3 years of history per recompute
const MAX_SCAN_WEEKS = 156;

export function isScheduledOn(habit, iso) {
  const frequency = habit.frequency || {};
  if (frequency.type === 'weekdays') {
    return (frequency.days || []).includes(dayOfWeek(iso));
  }
  return true;
}

export function isWeekly(habit) {
  return habit.frequency?.type === 'x_per_week';
}

function completedWeekMap(completedDates) {
  const map = new Map();
  for (const date of completedDates) {
    const start = weekStart(date);
    if (!map.has(start)) map.set(start, new Set());
    map.get(start).add(date);
  }
  return map;
}

function currentWeeklyStreak(weekMap, target, todayIso) {
  let streak = 0;
  let cursor = weekStart(todayIso);
  for (let i = 0; i < MAX_SCAN_WEEKS; i++) {
    const met = (weekMap.get(cursor)?.size || 0) >= target;
    if (met) {
      streak++;
    } else if (cursor !== weekStart(todayIso)) {
      break;
    }
    cursor = addDays(cursor, -7);
  }
  return streak;
}

function bestWeeklyStreak(weekMap, target, todayIso) {
  if (weekMap.size === 0) return 0;
  const firstWeek = [...weekMap.keys()].sort()[0];
  let cursor = firstWeek;
  const minWeek = addDays(weekStart(todayIso), -MAX_SCAN_WEEKS * 7);
  if (cursor < minWeek) cursor = minWeek;

  let run = 0;
  let best = 0;
  const currentWeek = weekStart(todayIso);
  while (cursor <= currentWeek) {
    if ((weekMap.get(cursor)?.size || 0) >= target) {
      run++;
      if (run > best) best = run;
    } else if (cursor !== currentWeek) {
      run = 0;
    }
    cursor = addDays(cursor, 7);
  }
  return best;
}

function currentDailyStreak(habit, completedSet, todayIso) {
  let streak = 0;
  let cursor = todayIso;
  for (let i = 0; i < MAX_SCAN_DAYS; i++) {
    if (!isScheduledOn(habit, cursor)) {
      cursor = addDays(cursor, -1);
      continue;
    }
    if (completedSet.has(cursor)) {
      streak++;
      cursor = addDays(cursor, -1);
      continue;
    }
    if (cursor === todayIso) {
      // today is still open — don't break the streak, check yesterday
      cursor = addDays(cursor, -1);
      continue;
    }
    break;
  }
  return streak;
}

function bestDailyStreak(habit, completedDates, todayIso) {
  if (completedDates.length === 0) return 0;
  const completedSet = new Set(completedDates);
  let cursor = completedDates[0];
  const minDate = addDays(todayIso, -MAX_SCAN_DAYS);
  if (cursor < minDate) cursor = minDate;

  let run = 0;
  let best = 0;
  while (cursor <= todayIso) {
    if (!isScheduledOn(habit, cursor)) {
      cursor = addDays(cursor, 1);
      continue;
    }
    if (completedSet.has(cursor)) {
      run++;
      if (run > best) best = run;
    } else if (cursor !== todayIso) {
      run = 0;
    }
    cursor = addDays(cursor, 1);
  }
  return best;
}

/**
 * @param {object} habit
 * @param {string[]} completedDates ascending ISO dates with a completed log
 * @param {string} todayIso today in the user's timezone
 * @returns {{ currentStreak: number, bestStreak: number }}
 */
export function computeStreaks(habit, completedDates, todayIso) {
  if (completedDates.length === 0) {
    return { currentStreak: 0, bestStreak: 0 };
  }
  if (isWeekly(habit)) {
    const target = Math.max(1, habit.frequency?.targetPerWeek || 1);
    const weekMap = completedWeekMap(completedDates);
    return {
      currentStreak: currentWeeklyStreak(weekMap, target, todayIso),
      bestStreak: bestWeeklyStreak(weekMap, target, todayIso),
    };
  }
  const completedSet = new Set(completedDates);
  return {
    currentStreak: currentDailyStreak(habit, completedSet, todayIso),
    bestStreak: bestDailyStreak(habit, completedDates, todayIso),
  };
}

/**
 * This week's progress for one habit: completed vs expected occurrences
 * so far this week (Monday-start, only days up to today count).
 */
export function weekProgress(habit, completedDates, todayIso) {
  const completedThisWeek = completedDates.filter((d) => weekStart(d) === weekStart(todayIso));
  if (isWeekly(habit)) {
    const target = Math.max(1, habit.frequency?.targetPerWeek || 1);
    return { completed: Math.min(completedThisWeek.length, target), target };
  }
  const start = weekStart(todayIso);
  let target = 0;
  for (let i = 0; i < 7; i++) {
    const day = addDays(start, i);
    if (day > todayIso) break;
    if (isScheduledOn(habit, day)) target++;
  }
  const completedDays = new Set(completedThisWeek).size;
  return { completed: Math.min(completedDays, target), target };
}
