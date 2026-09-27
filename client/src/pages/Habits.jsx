import { useMemo, useState } from 'react';
import HabitRow from '../components/HabitRow.jsx';
import Heatmap from '../components/Heatmap.jsx';
import Modal from '../components/Modal.jsx';
import {
  useCreateHabit,
  useDeleteHabit,
  useHabitHistory,
  useHabits,
  useLogHabit,
  useUpdateHabit,
} from '../queries';
import { useAuth } from '../store/auth';
import { addDays, todayInTz } from '../lib/dates';
import { HABIT_COLORS, HABIT_ICONS, frequencyLabel } from '../lib/habits';

const EMPTY_FORM = {
  name: '',
  icon: '✅',
  color: HABIT_COLORS[0],
  frequency: { type: 'daily', days: [1, 2, 3, 4, 5], targetPerWeek: 3 },
};

const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function HabitForm({ initial, onSubmit, onCancel, busy }) {
  const [form, setForm] = useState(initial);
  const [error, setError] = useState('');

  function set(patch) {
    setForm((f) => ({ ...f, ...patch }));
  }
  function setFreq(patch) {
    setForm((f) => ({ ...f, frequency: { ...f.frequency, ...patch } }));
  }

  function submit(e) {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) return setError('Give your habit a name');
    if (form.frequency.type === 'weekdays' && form.frequency.days.length === 0) {
      return setError('Pick at least one day');
    }
    onSubmit({
      name: form.name.trim(),
      icon: form.icon,
      color: form.color,
      frequency: {
        type: form.frequency.type,
        days: form.frequency.type === 'weekdays' ? form.frequency.days : [],
        targetPerWeek: form.frequency.targetPerWeek,
      },
    });
  }

  const inputCls =
    'w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-950';

  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="block">
        <span className="mb-1 block text-sm font-bold text-slate-600 dark:text-slate-300">Name</span>
        <input
          autoFocus
          value={form.name}
          onChange={(e) => set({ name: e.target.value })}
          placeholder="e.g. Drink water"
          maxLength={80}
          className={inputCls}
        />
      </label>

      <div>
        <span className="mb-1 block text-sm font-bold text-slate-600 dark:text-slate-300">Icon</span>
        <div className="flex flex-wrap gap-1.5">
          {HABIT_ICONS.map((icon) => (
            <button
              key={icon}
              type="button"
              aria-label={`Icon ${icon}`}
              onClick={() => set({ icon })}
              className={[
                'h-9 w-9 rounded-xl text-lg transition',
                form.icon === icon
                  ? 'bg-brand-100 ring-2 ring-brand-500 dark:bg-brand-900/60'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700',
              ].join(' ')}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>

      <div>
        <span className="mb-1 block text-sm font-bold text-slate-600 dark:text-slate-300">Color</span>
        <div className="flex flex-wrap gap-2">
          {HABIT_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              aria-label={`Color ${color}`}
              onClick={() => set({ color })}
              className={[
                'h-7 w-7 rounded-full transition',
                form.color === color ? 'ring-2 ring-offset-2 ring-slate-500 dark:ring-offset-slate-900' : '',
              ].join(' ')}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>

      <div>
        <span className="mb-1 block text-sm font-bold text-slate-600 dark:text-slate-300">How often</span>
        <div className="grid grid-cols-3 gap-2">
          {[
            ['daily', 'Every day'],
            ['weekdays', 'Specific days'],
            ['x_per_week', 'Times per week'],
          ].map(([type, label]) => (
            <button
              key={type}
              type="button"
              onClick={() => setFreq({ type })}
              className={[
                'rounded-xl border px-2 py-2 text-xs font-bold transition',
                form.frequency.type === type
                  ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/50 dark:text-brand-200'
                  : 'border-slate-200 text-slate-500 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>

        {form.frequency.type === 'weekdays' && (
          <div className="mt-2 flex gap-1.5">
            {DAY_LETTERS.map((letter, i) => {
              const active = form.frequency.days.includes(i);
              return (
                <button
                  key={i}
                  type="button"
                  aria-pressed={active}
                  aria-label={`Toggle day ${i}`}
                  onClick={() =>
                    setFreq({
                      days: active
                        ? form.frequency.days.filter((d) => d !== i)
                        : [...form.frequency.days, i].sort(),
                    })
                  }
                  className={[
                    'h-9 w-9 rounded-full text-sm font-bold transition',
                    active
                      ? 'bg-brand-500 text-white'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400',
                  ].join(' ')}
                >
                  {letter}
                </button>
              );
            })}
          </div>
        )}

        {form.frequency.type === 'x_per_week' && (
          <div className="mt-2 flex gap-1.5">
            {[1, 2, 3, 4, 5, 6, 7].map((n) => (
              <button
                key={n}
                type="button"
                aria-pressed={form.frequency.targetPerWeek === n}
                onClick={() => setFreq({ targetPerWeek: n })}
                className={[
                  'h-9 w-9 rounded-full text-sm font-bold transition',
                  form.frequency.targetPerWeek === n
                    ? 'bg-brand-500 text-white'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400',
                ].join(' ')}
              >
                {n}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && (
        <p role="alert" className="text-sm font-semibold text-amber-600 dark:text-amber-400">
          {error}
        </p>
      )}

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-xl border border-slate-300 py-2.5 font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={busy}
          className="flex-1 rounded-xl bg-brand-500 py-2.5 font-bold text-white hover:bg-brand-600 disabled:opacity-60"
        >
          {busy ? 'Saving…' : 'Save habit'}
        </button>
      </div>
    </form>
  );
}

function HabitDetail({ habit, today }) {
  const from = addDays(today, -83);
  const history = useHabitHistory(habit.id, from, today);

  const cells = useMemo(() => {
    if (!history.data) return [];
    const done = new Map(history.data.logs.map((l) => [l.date, l.completed]));
    const out = [];
    for (let d = from; d <= today; d = addDays(d, 1)) {
      out.push({ date: d, completed: Boolean(done.get(d)), scheduled: 1 });
    }
    return out;
  }, [history.data, from, today]);

  return (
    <div className="mt-3 border-t border-slate-100 pt-3 dark:border-slate-800">
      <div className="mb-2 flex flex-wrap gap-4 text-sm">
        <span className="text-slate-500 dark:text-slate-400">
          Current: <b className="text-slate-800 dark:text-slate-100">{habit.stats.currentStreak}</b>
        </span>
        <span className="text-slate-500 dark:text-slate-400">
          Best: <b className="text-slate-800 dark:text-slate-100">{habit.stats.bestStreak}</b>
        </span>
        <span className="text-slate-500 dark:text-slate-400">
          {frequencyLabel(habit.frequency)}
        </span>
      </div>
      {history.isLoading ? (
        <div className="h-20 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
      ) : (
        <Heatmap cells={cells} weeks={12} single />
      )}
    </div>
  );
}

export default function Habits() {
  const user = useAuth((s) => s.user);
  const today = todayInTz(user?.timezone || 'UTC');

  const habits = useHabits();
  const logHabit = useLogHabit();
  const createHabit = useCreateHabit();
  const updateHabit = useUpdateHabit();
  const deleteHabit = useDeleteHabit();

  const [modal, setModal] = useState(null); // null | 'new' | habit object
  const [expanded, setExpanded] = useState(null);
  const [confirmArchive, setConfirmArchive] = useState(null);

  const list = habits.data?.habits || [];

  async function save(values) {
    if (modal === 'new') await createHabit.mutateAsync(values);
    else await updateHabit.mutateAsync({ id: modal.id, ...values });
    setModal(null);
  }

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Habits</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Small things, done often. Tap the circle to check in.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModal('new')}
          className="rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-600"
        >
          + New habit
        </button>
      </header>

      {habits.isLoading ? (
        <div className="h-24 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
      ) : list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center dark:border-slate-700">
          <div className="text-3xl" aria-hidden>🌱</div>
          <p className="mt-2 font-bold">Let's start today.</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Pick one habit you'd actually enjoy keeping.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {list.map((habit) => (
            <li
              key={habit.id}
              className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"
            >
              <HabitRow habit={habit} onToggle={(h) => logHabit.mutate({ id: h.id, date: today })} busy={logHabit.isPending} />

              <div className="mt-2 flex items-center gap-2 px-1">
                <button
                  type="button"
                  onClick={() => setExpanded(expanded === habit.id ? null : habit.id)}
                  className="text-xs font-bold text-brand-600 hover:underline dark:text-brand-400"
                  aria-expanded={expanded === habit.id}
                >
                  {expanded === habit.id ? 'Hide history' : 'Show history'}
                </button>
                <span className="text-slate-300 dark:text-slate-600">·</span>
                <button
                  type="button"
                  onClick={() => setModal(habit)}
                  className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  Edit
                </button>
                <span className="text-slate-300 dark:text-slate-600">·</span>
                <button
                  type="button"
                  onClick={() => setConfirmArchive(habit)}
                  className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  Archive
                </button>
              </div>

              {expanded === habit.id && <HabitDetail habit={habit} today={today} />}
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={modal !== null}
        onClose={() => setModal(null)}
        title={modal === 'new' ? 'New habit' : 'Edit habit'}
      >
        {modal && (
          <HabitForm
            initial={
              modal === 'new'
                ? EMPTY_FORM
                : {
                    name: modal.name,
                    icon: modal.icon,
                    color: modal.color,
                    frequency: {
                      type: modal.frequency.type,
                      days: modal.frequency.days || [],
                      targetPerWeek: modal.frequency.targetPerWeek || 3,
                    },
                  }
            }
            onSubmit={save}
            onCancel={() => setModal(null)}
            busy={createHabit.isPending || updateHabit.isPending}
          />
        )}
      </Modal>

      <Modal
        open={confirmArchive !== null}
        onClose={() => setConfirmArchive(null)}
        title="Archive habit?"
      >
        <p className="text-sm text-slate-500 dark:text-slate-400">
          “{confirmArchive?.name}” will be hidden from your list. Its history stays in your
          account.
        </p>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => setConfirmArchive(null)}
            className="flex-1 rounded-xl border border-slate-300 py-2.5 font-bold text-slate-600 dark:border-slate-700 dark:text-slate-300"
          >
            Keep it
          </button>
          <button
            type="button"
            onClick={async () => {
              await deleteHabit.mutateAsync(confirmArchive.id);
              setConfirmArchive(null);
            }}
            className="flex-1 rounded-xl bg-slate-800 py-2.5 font-bold text-white hover:bg-slate-700 dark:bg-slate-200 dark:text-slate-900"
          >
            Archive
          </button>
        </div>
      </Modal>
    </div>
  );
}
