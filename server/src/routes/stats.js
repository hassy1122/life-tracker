import { Router } from 'express';
import Habit from '../models/Habit.js';
import HabitLog from '../models/HabitLog.js';
import { requireAuth } from '../middleware/auth.js';
import { addDays, isValidIsoDate, todayInTz, weekStart } from '../lib/dates.js';
import { isScheduledOn, isWeekly, weekProgress } from '../lib/streaks.js';

const router = Router();
router.use(requireAuth);

// Dashboard summary: cached streaks + this week's completion rate.
// Reads only the current week's logs — never a full-history scan.
router.get('/summary', async (req, res) => {
  const today = todayInTz(req.user.timezone);
  const weekFrom = weekStart(today);

  const [habits, weekLogs] = await Promise.all([
    Habit.find({ userId: req.user._id, archivedAt: null }).sort({ createdAt: 1 }),
    HabitLog.find({
      userId: req.user._id,
      completed: true,
      date: { $gte: weekFrom, $lte: today },
    }).select('habitId date'),
  ]);

  const byHabit = new Map();
  for (const log of weekLogs) {
    const key = log.habitId.toString();
    if (!byHabit.has(key)) byHabit.set(key, []);
    byHabit.get(key).push(log.date);
  }

  let totalCompleted = 0;
  let totalTarget = 0;
  let scheduledToday = 0;
  let doneToday = 0;
  let activeStreaks = 0;

  const habitStats = habits.map((habit) => {
    const key = habit._id.toString();
    const completedDates = byHabit.get(key) || [];
    const progress = weekProgress(habit, completedDates, today);
    const scheduled = isScheduledOn(habit, today);
    const done = completedDates.includes(today);

    totalCompleted += progress.completed;
    totalTarget += progress.target;
    if (scheduled) scheduledToday++;
    if (scheduled && done) doneToday++;
    if (habit.stats.currentStreak > 0) activeStreaks++;

    return {
      habitId: key,
      name: habit.name,
      icon: habit.icon,
      color: habit.color,
      currentStreak: habit.stats.currentStreak,
      bestStreak: habit.stats.bestStreak,
      scheduledToday: scheduled,
      doneToday: done,
      week: progress,
      weekly: isWeekly(habit),
    };
  });

  res.json({
    today,
    weekFrom,
    weekRate: totalTarget > 0 ? Math.round((totalCompleted / totalTarget) * 100) : null,
    todayProgress: { completed: doneToday, scheduled: scheduledToday },
    activeStreaks,
    longestStreak: habitStats.reduce((max, h) => Math.max(max, h.currentStreak), 0),
    habits: habitStats,
  });
});

// GitHub-style intensity grid: per-day completion fraction across all habits.
router.get('/heatmap', async (req, res) => {
  const today = todayInTz(req.user.timezone);
  const days = Math.min(365, Math.max(7, Number(req.query.days) || 84));
  const from = addDays(today, -(days - 1));

  const [habits, logs] = await Promise.all([
    Habit.find({ userId: req.user._id, archivedAt: null }),
    HabitLog.find({
      userId: req.user._id,
      completed: true,
      date: { $gte: from, $lte: today },
    }).select('habitId date'),
  ]);

  const completedByDay = new Map();
  for (const log of logs) {
    completedByDay.set(log.date, (completedByDay.get(log.date) || 0) + 1);
  }

  const cells = [];
  for (let date = from; date <= today; date = addDays(date, 1)) {
    const scheduled = habits.filter((h) => isScheduledOn(h, date)).length;
    const completed = Math.min(completedByDay.get(date) || 0, scheduled);
    cells.push({ date, scheduled, completed, ratio: scheduled ? completed / scheduled : 0 });
  }

  res.json({ from, to: today, cells });
});

export default router;
