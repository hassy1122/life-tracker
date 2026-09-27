import { relativeDayLabel } from '../lib/dates';

const PRIORITY = {
  high: { label: 'High', dot: 'bg-amber-400' },
  medium: { label: 'Medium', dot: 'bg-sky-400' },
  low: { label: 'Low', dot: 'bg-slate-300 dark:bg-slate-600' },
};

export default function TaskRow({ task, today, onToggle, onEdit, onDelete, showDate = true }) {
  const overdue = !task.completed && task.dueDate && task.dueDate < today;
  const priority = PRIORITY[task.priority] || PRIORITY.medium;

  return (
    <li className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 transition dark:border-slate-800 dark:bg-slate-900">
      <button
        type="button"
        aria-pressed={task.completed}
        aria-label={task.completed ? `Reopen ${task.title}` : `Complete ${task.title}`}
        onClick={() => onToggle(task)}
        className={[
          'flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition',
          task.completed
            ? 'border-brand-500 bg-brand-500 text-white animate-pop'
            : 'border-slate-300 hover:border-brand-400 dark:border-slate-700',
        ].join(' ')}
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M5 13l4 4L19 7" />
        </svg>
      </button>

      <div className="min-w-0 flex-1">
        <p className={['truncate font-semibold', task.completed ? 'text-slate-400 line-through dark:text-slate-500' : ''].join(' ')}>
          {task.title}
        </p>
        {(task.dueDate || task.priority !== 'medium') && (
          <div className="flex items-center gap-2 text-xs">
            {showDate && task.dueDate && (
              <span className={overdue ? 'font-bold text-amber-600 dark:text-amber-400' : 'text-slate-400 dark:text-slate-500'}>
                {relativeDayLabel(task.dueDate, today)}
                {overdue && ' · overdue'}
              </span>
            )}
            {task.priority !== 'medium' && (
              <span className="inline-flex items-center gap-1 text-slate-400 dark:text-slate-500">
                <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${priority.dot}`} />
                {priority.label}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1 opacity-0 transition group-focus-within:opacity-100 group-hover:opacity-100 sm:opacity-0">
        <button
          type="button"
          aria-label={`Edit ${task.title}`}
          onClick={() => onEdit(task)}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        >
          ✏️
        </button>
        <button
          type="button"
          aria-label={`Delete ${task.title}`}
          onClick={() => onDelete(task)}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        >
          🗑️
        </button>
      </div>
    </li>
  );
}
