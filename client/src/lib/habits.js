import { WEEKDAY_SHORT, WEEKDAY_LETTER } from './dates';

export function frequencyLabel(frequency) {
  if (!frequency) return 'Every day';
  if (frequency.type === 'daily') return 'Every day';
  if (frequency.type === 'x_per_week') return `${frequency.targetPerWeek}× per week`;
  const days = (frequency.days || []).slice().sort((a, b) => a - b);
  if (days.length === 7) return 'Every day';
  if (days.length === 5 && days.join() === '1,2,3,4,5') return 'Weekdays';
  if (days.length === 2 && days.join() === '0,6') return 'Weekends';
  return days.map((d) => WEEKDAY_SHORT[d]).join(', ');
}

export function frequencyShort(frequency) {
  if (!frequency || frequency.type === 'daily') return 'daily';
  if (frequency.type === 'x_per_week') return `${frequency.targetPerWeek}×/wk`;
  return (frequency.days || []).slice().sort((a, b) => a - b).map((d) => WEEKDAY_LETTER[d]).join('');
}

export function isScheduled(habit, iso, dayOfWeekFn) {
  if (habit.frequency?.type === 'weekdays') {
    return (habit.frequency.days || []).includes(dayOfWeekFn(iso));
  }
  return true;
}

export const HABIT_COLORS = [
  '#4f9d69',
  '#5b8def',
  '#c98a3d',
  '#8b6cc1',
  '#c1666b',
  '#3f9aa8',
  '#7a8f4a',
  '#b5658a',
];

export const HABIT_ICONS = ['✅', '💧', '🏃', '📖', '🧘', '💊', '😴', '✍️', '🥗', '🚭', '🎸', '🧹'];
