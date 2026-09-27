import { frequencyLabel } from '../lib/habits';

function Streak({ streak }) {
  if (!streak) {
    return (
      <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">Start today</span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400"
      title={`${streak} day streak`}
    >
      <span aria-hidden>🔥</span>
      {streak}
      <span className="sr-only"> current streak</span>
    </span>
  );
}

export default function HabitRow({ habit, onToggle, busy = false }) {
  const restDay = !habit.scheduledToday;
  const done = habit.doneToday;

  return (
    <li
      className={[
        'flex items-center gap-3 rounded-2xl border bg-white px-3 py-2.5 transition dark:bg-slate-900',
        done
          ? 'border-brand-200 dark:border-brand-800'
          : 'border-slate-200 dark:border-slate-800',
        restDay ? 'opacity-60' : '',
      ].join(' ')}
    >
      <span
        aria-hidden
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg"
        style={{ backgroundColor: `${habit.color}1f` }}
      >
        {habit.icon}
      </span>

      <div className="min-w-0 flex-1">
        <p className={['truncate font-semibold', done ? 'text-slate-400 line-through dark:text-slate-500' : ''].join(' ')}>
          {habit.name}
        </p>
        <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
          <span>{frequencyLabel(habit.frequency)}</span>
          {restDay && <span aria-hidden>·</span>}
          {restDay && <span>rest day</span>}
          {!restDay && habit.stats?.currentStreak > 0 && (
            <>
              <span aria-hidden>·</span>
              <Streak streak={habit.stats.currentStreak} />
            </>
          )}
        </div>
      </div>

      <button
        type="button"
        disabled={restDay || busy}
        aria-pressed={done}
        aria-label={done ? `Mark ${habit.name} as not done` : `Mark ${habit.name} as done`}
        onClick={() => onToggle(habit)}
        className={[
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-lg transition',
          'disabled:cursor-not-allowed disabled:opacity-40',
          done
            ? 'border-brand-500 bg-brand-500 text-white animate-pop'
            : 'border-slate-300 text-transparent hover:border-brand-400 hover:bg-brand-50 dark:border-slate-700 dark:hover:bg-slate-800',
        ].join(' ')}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M5 13l4 4L19 7" />
        </svg>
      </button>
    </li>
  );
}
