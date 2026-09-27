import { formatFriendly } from '../lib/dates';

function level(ratio) {
  if (ratio >= 1) return 'bg-brand-500';
  if (ratio >= 0.66) return 'bg-brand-300';
  if (ratio > 0) return 'bg-brand-200';
  return 'bg-slate-200 dark:bg-slate-800';
}

function cellTitle(cell) {
  if (!cell.scheduled) return `${formatFriendly(cell.date)} — rest day`;
  if (cell.completed === 0) return `${formatFriendly(cell.date)} — nothing completed`;
  return `${formatFriendly(cell.date)} — ${cell.completed}/${cell.scheduled} completed`;
}

/**
 * GitHub-style intensity grid. `cells` = [{ date, scheduled, completed, ratio }]
 * (or just `{date, completed: bool}` for a single habit).
 */
export default function Heatmap({ cells, weeks = 12, single = false }) {
  if (!cells?.length) return null;

  // Column = week (oldest on the left), row = weekday (Mon..Sun to match weeks).
  const byDate = new Map(cells.map((c) => [c.date, c]));
  const lastDate = cells[cells.length - 1].date;
  const lastDay = new Date(`${lastDate}T12:00:00Z`).getUTCDay();
  const endOfLastWeek = new Date(`${lastDate}T12:00:00Z`);
  endOfLastWeek.setUTCDate(endOfLastWeek.getUTCDate() + (6 - lastDay));
  const endDate = endOfLastWeek.toISOString().slice(0, 10);

  const columns = [];
  let cursor = endDate;
  for (let w = 0; w < weeks; w++) {
    const col = [];
    for (let d = 6; d >= 0; d--) {
      const date = new Date(`${cursor}T12:00:00Z`);
      date.setUTCDate(date.getUTCDate() - d);
      col.push(date.toISOString().slice(0, 10));
    }
    columns.unshift(col);
    const start = new Date(`${cursor}T12:00:00Z`);
    start.setUTCDate(start.getUTCDate() - 7);
    cursor = start.toISOString().slice(0, 10);
  }

  return (
    <div className="overflow-x-auto pb-1">
      <div className="flex min-w-max gap-1" aria-label="Completion history">
        {columns.map((col) => (
          <div key={col[0]} className="flex flex-col gap-1">
            {col.map((date) => {
              const cell = byDate.get(date);
              const future = date > lastDate;
              const scheduled = cell?.scheduled ?? 1;
              const completed = single ? (cell?.completed ? 1 : 0) : cell?.completed ?? 0;
              const ratio = scheduled ? completed / scheduled : 0;
              const done = single ? Boolean(cell?.completed) : completed >= scheduled && scheduled > 0;
              const title = cell
                ? single
                  ? `${formatFriendly(cell.date)} — ${cell.completed ? 'done' : 'not done'}`
                  : cellTitle(cell)
                : formatFriendly(date);

              return (
                <div
                  key={date}
                  title={title}
                  aria-label={title}
                  className={[
                    'h-3 w-3 rounded-[3px]',
                    future || !cell ? 'bg-slate-100 dark:bg-slate-800/50' : level(ratio),
                    done && single ? 'ring-1 ring-brand-700/30' : '',
                  ].join(' ')}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
