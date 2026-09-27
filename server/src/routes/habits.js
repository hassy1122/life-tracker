import { Router } from 'express';
import Habit from '../models/Habit.js';
import HabitLog from '../models/HabitLog.js';
import { requireAuth } from '../middleware/auth.js';
import { addDays, isValidIsoDate, todayInTz } from '../lib/dates.js';
import { computeStreaks, isScheduledOn } from '../lib/streaks.js';

const router = Router();
router.use(requireAuth);

const HISTORY_WINDOW_DAYS = 1095;

function parseFrequency(input) {
  const freq = input || {};
  const type = ['daily', 'weekdays', 'x_per_week'].includes(freq.type) ? freq.type : 'daily';
  const days = Array.isArray(freq.days)
    ? [...new Set(freq.days.map(Number).filter((d) => Number.isInteger(d) && d >= 0 && d <= 6))].sort()
    : [];
  const targetPerWeek =
    Number.isInteger(Number(freq.targetPerWeek)) && Number(freq.targetPerWeek) >= 1
      ? Math.min(7, Number(freq.targetPerWeek))
      : 3;

  if (type === 'weekdays' && days.length === 0) {
    return { error: 'Pick at least one weekday' };
  }
  return { frequency: { type, days, targetPerWeek } };
}

async function recomputeStats(habit, todayIso) {
  const since = addDays(todayIso, -HISTORY_WINDOW_DAYS);
  const logs = await HabitLog.find({
    habitId: habit._id,
    completed: true,
    date: { $gte: since, $lte: todayIso },
  })
    .sort({ date: 1 })
    .select('date');

  const { currentStreak, bestStreak } = computeStreaks(
    habit,
    logs.map((l) => l.date),
    todayIso,
  );
  habit.stats = { currentStreak, bestStreak, computedAt: new Date() };
  await habit.save();
  return habit;
}

function serialize(habit, todayIso, doneToday = false) {
  return {
    id: habit._id.toString(),
    name: habit.name,
    icon: habit.icon,
    color: habit.color,
    frequency: habit.frequency,
    archivedAt: habit.archivedAt,
    stats: habit.stats,
    scheduledToday: isScheduledOn(habit, todayIso),
    doneToday,
    createdAt: habit.createdAt,
  };
}

router.get('/', async (req, res) => {
  const today = todayInTz(req.user.timezone);
  const habits = await Habit.find({ userId: req.user._id, archivedAt: null }).sort({ createdAt: 1 });
  const logs = await HabitLog.find({ userId: req.user._id, date: today, completed: true }).select(
    'habitId',
  );
  const done = new Set(logs.map((l) => l.habitId.toString()));

  res.json({
    today,
    habits: habits.map((h) => serialize(h, today, done.has(h._id.toString()))),
  });
});

router.post('/', async (req, res) => {
  const { name, icon, color } = req.body || {};
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Habit name is required' });
  }
  const parsed = parseFrequency(req.body?.frequency);
  if (parsed.error) return res.status(400).json({ error: parsed.error });

  const today = todayInTz(req.user.timezone);
  const habit = await Habit.create({
    userId: req.user._id,
    name: String(name).trim().slice(0, 80),
    icon: typeof icon === 'string' && icon.trim() ? icon.trim().slice(0, 8) : '✅',
    color: typeof color === 'string' && color ? color : '#4f9d69',
    frequency: parsed.frequency,
  });
  await recomputeStats(habit, today);
  res.status(201).json({ habit: serialize(habit, today, false) });
});

router.put('/:id', async (req, res) => {
  const today = todayInTz(req.user.timezone);
  const habit = await Habit.findOne({ _id: req.params.id, userId: req.user._id, archivedAt: null });
  if (!habit) return res.status(404).json({ error: 'Habit not found' });

  const { name, icon, color, frequency } = req.body || {};
  let scheduleChanged = false;

  if (name !== undefined) {
    if (typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Habit name cannot be empty' });
    }
    habit.name = String(name).trim().slice(0, 80);
  }
  if (icon !== undefined) habit.icon = String(icon).trim().slice(0, 8) || habit.icon;
  if (color !== undefined && color) habit.color = String(color);
  if (frequency !== undefined) {
    const parsed = parseFrequency(frequency);
    if (parsed.error) return res.status(400).json({ error: parsed.error });
    scheduleChanged = JSON.stringify(parsed.frequency) !== JSON.stringify(habit.frequency);
    habit.frequency = parsed.frequency;
  }

  if (scheduleChanged) await recomputeStats(habit, today);
  else await habit.save();

  res.json({ habit: serialize(habit, today, false) });
});

router.delete('/:id', async (req, res) => {
  const habit = await Habit.findOne({ _id: req.params.id, userId: req.user._id, archivedAt: null });
  if (!habit) return res.status(404).json({ error: 'Habit not found' });
  habit.archivedAt = new Date();
  await habit.save();
  res.status(204).end();
});

// Toggle (or explicitly set) completion for a date — defaults to today in the
// user's timezone. Backdating is allowed; streaks are recomputed from the
// affected date forward because they are derived from the full log set.
router.post('/:id/log', async (req, res) => {
  const userTz = req.user.timezone;
  const today = todayInTz(userTz);
  const habit = await Habit.findOne({ _id: req.params.id, userId: req.user._id, archivedAt: null });
  if (!habit) return res.status(404).json({ error: 'Habit not found' });

  const date = req.body?.date ?? today;
  if (!isValidIsoDate(date)) return res.status(400).json({ error: 'Invalid date' });
  if (date > today) return res.status(400).json({ error: 'Cannot log a future date' });

  const existing = await HabitLog.findOne({ habitId: habit._id, date });
  let completed;
  if (typeof req.body?.completed === 'boolean') {
    completed = req.body.completed;
  } else {
    completed = !(existing && existing.completed);
  }

  await HabitLog.updateOne(
    { habitId: habit._id, date },
    { $set: { completed, userId: req.user._id } },
    { upsert: true },
  );

  await recomputeStats(habit, today);

  res.json({
    date,
    completed,
    habit: serialize(habit, today, date === today ? completed : habit.stats.currentStreak > 0),
  });
});

router.get('/:id/history', async (req, res) => {
  const today = todayInTz(req.user.timezone);
  const habit = await Habit.findOne({ _id: req.params.id, userId: req.user._id });
  if (!habit) return res.status(404).json({ error: 'Habit not found' });

  const to = isValidIsoDate(req.query.to) ? req.query.to : today;
  const from = isValidIsoDate(req.query.from) ? req.query.from : addDays(to, -89);
  if (from > to) return res.status(400).json({ error: '`from` must be before `to`' });

  const logs = await HabitLog.find({ habitId: habit._id, date: { $gte: from, $lte: to } })
    .sort({ date: 1 })
    .select('date completed');

  res.json({
    from,
    to,
    logs: logs.map((l) => ({ date: l.date, completed: l.completed })),
  });
});

export default router;
