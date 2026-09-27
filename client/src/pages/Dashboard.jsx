import { useState } from 'react';
import { Link } from 'react-router-dom';
import HabitRow from '../components/HabitRow.jsx';
import TaskRow from '../components/TaskRow.jsx';
import Heatmap from '../components/Heatmap.jsx';
import {
  useCreateTask,
  useHabits,
  useHeatmap,
  useLogHabit,
  useSummary,
  useTasks,
  useUpdateTask,
} from '../queries';
import { useAuth } from '../store/auth';
import { todayInTz } from '../lib/dates';

function greeting() {
  const hour = new Date().getHours();
  if (hour < 5) return 'Still up';
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function StatCard({ label, value, sub, icon }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold tracking-wide text-slate-400 uppercase dark:text-slate-500">
          {label}
        </span>
        <span aria-hidden className="text-sm">{icon}</span>
      </div>
      <p className="mt-1 text-2xl font-extrabold">{value}</p>
      <p className="text-xs text-slate-400 dark:text-slate-500">{sub}</p>
    </div>
  );
}

function Card({ title, action, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-base font-extrabold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export default function Dashboard() {
  const user = useAuth((s) => s.user);
  const today = todayInTz(user?.timezone || 'UTC');

  const summary = useSummary();
  const habits = useHabits();
  const heatmap = useHeatmap(84);
  const tasks = useTasks({ completed: 'false', to: today });
  const logHabit = useLogHabit();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const [quickTitle, setQuickTitle] = useState('');

  const habitList = habits.data?.habits || [];
  const summaryData = summary.data;
  const todayTasks = tasks.data?.tasks || [];

  function toggle(habit) {
    logHabit.mutate({ id: habit.id, date: today });
  }

  async function quickAddTask(e) {
    e.preventDefault();
    const title = quickTitle.trim();
    if (!title) return;
    setQuickTitle('');
    await createTask.mutateAsync({ title, dueDate: today, priority: 'medium' });
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-extrabold">
          {greeting()}, {user?.name?.split(' ')[0]}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          A quiet look at today. Everything else can wait.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Today"
          value={
            summaryData
              ? `${summaryData.todayProgress.completed}/${summaryData.todayProgress.scheduled}`
              : '—'
          }
          sub="habits done"
          icon="✅"
        />
        <StatCard
          label="This week"
          value={summaryData?.weekRate != null ? `${summaryData.weekRate}%` : '—'}
          sub="completion rate"
          icon="📊"
        />
        <StatCard
          label="Streaks"
          value={summaryData?.longestStreak ? `🔥 ${summaryData.longestStreak}` : '—'}
          sub={
            summaryData?.longestStreak
              ? 'longest active streak'
              : 'start today, no pressure'
          }
          icon="⚡"
        />
        <StatCard
          label="Tasks"
          value={todayTasks.length}
          sub="open, due today or earlier"
          icon="📝"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card
          title="Today's habits"
          action={
            <Link to="/habits" className="text-sm font-bold text-brand-600 hover:underline dark:text-brand-400">
              Manage
            </Link>
          }
        >
          {habits.isLoading ? (
            <p className="text-sm text-slate-400">Loading…</p>
          ) : habitList.length === 0 ? (
            <div className="rounded-xl bg-sand-100 p-5 text-center dark:bg-slate-800/60">
              <p className="text-sm font-semibold">No habits yet.</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Start with one small thing you'd like to do daily.
              </p>
              <Link
                to="/habits"
                className="mt-3 inline-block rounded-xl bg-brand-500 px-4 py-2 text-sm font-bold text-white hover:bg-brand-600"
              >
                Create your first habit
              </Link>
            </div>
          ) : (
            <ul className="space-y-2">
              {habitList.map((habit) => (
                <HabitRow
                  key={habit.id}
                  habit={habit}
                  onToggle={toggle}
                  busy={logHabit.isPending}
                />
              ))}
            </ul>
          )}
        </Card>

        <Card
          title="Due today"
          action={
            <Link to="/tasks" className="text-sm font-bold text-brand-600 hover:underline dark:text-brand-400">
              View all
            </Link>
          }
        >
          <form onSubmit={quickAddTask} className="mb-3 flex gap-2">
            <input
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              placeholder="Add a task for today…"
              aria-label="Add a task for today"
              className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-950"
            />
            <button
              type="submit"
              disabled={createTask.isPending || !quickTitle.trim()}
              className="rounded-xl bg-brand-500 px-3 py-2 text-sm font-bold text-white hover:bg-brand-600 disabled:opacity-50"
            >
              Add
            </button>
          </form>

          {tasks.isLoading ? (
            <p className="text-sm text-slate-400">Loading…</p>
          ) : todayTasks.length === 0 ? (
            <p className="rounded-xl bg-sand-100 p-4 text-center text-sm text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
              Nothing due today. Enjoy the space. ✨
            </p>
          ) : (
            <ul className="space-y-2">
              {todayTasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  today={today}
                  onToggle={(t) =>
                    updateTask.mutate({ id: t.id, completed: !t.completed })
                  }
                  showDate
                />
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card
        title="Last 12 weeks"
        action={
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
            consistency at a glance
          </span>
        }
      >
        {heatmap.data ? (
          <Heatmap cells={heatmap.data.cells} weeks={12} />
        ) : (
          <div className="h-24 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
        )}
      </Card>
    </div>
  );
}
