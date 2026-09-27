import { useMemo, useState } from 'react';
import TaskRow from '../components/TaskRow.jsx';
import Modal from '../components/Modal.jsx';
import { useCreateTask, useDeleteTask, useTasks, useUpdateTask } from '../queries';
import { useAuth } from '../store/auth';
import { addDays, formatFriendly, todayInTz } from '../lib/dates';

const EMPTY = { title: '', dueDate: '', priority: 'medium' };

function TaskForm({ initial, onSubmit, onCancel, busy }) {
  const [form, setForm] = useState(initial);
  const [error, setError] = useState('');

  function submit(e) {
    e.preventDefault();
    if (!form.title.trim()) return setError('Give the task a title');
    onSubmit({
      title: form.title.trim(),
      dueDate: form.dueDate || null,
      priority: form.priority,
    });
  }

  const inputCls =
    'w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-950';

  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="block">
        <span className="mb-1 block text-sm font-bold text-slate-600 dark:text-slate-300">Task</span>
        <input
          autoFocus
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          placeholder="e.g. Call the dentist"
          maxLength={200}
          className={inputCls}
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-bold text-slate-600 dark:text-slate-300">
          Due date <span className="font-normal text-slate-400">(optional)</span>
        </span>
        <input
          type="date"
          value={form.dueDate}
          onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
          className={inputCls}
        />
      </label>

      <div>
        <span className="mb-1 block text-sm font-bold text-slate-600 dark:text-slate-300">Priority</span>
        <div className="grid grid-cols-3 gap-2">
          {['low', 'medium', 'high'].map((priority) => (
            <button
              key={priority}
              type="button"
              onClick={() => setForm((f) => ({ ...f, priority }))}
              className={[
                'rounded-xl border px-2 py-2 text-xs font-bold capitalize transition',
                form.priority === priority
                  ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/50 dark:text-brand-200'
                  : 'border-slate-200 text-slate-500 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400',
              ].join(' ')}
            >
              {priority}
            </button>
          ))}
        </div>
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
          {busy ? 'Saving…' : 'Save task'}
        </button>
      </div>
    </form>
  );
}

function Section({ title, count, children }) {
  if (!children?.length && count === 0) return null;
  return (
    <section>
      <h2 className="mb-2 text-xs font-bold tracking-wide text-slate-400 uppercase dark:text-slate-500">
        {title}
      </h2>
      <ul className="space-y-2">{children}</ul>
    </section>
  );
}

export default function Tasks() {
  const user = useAuth((s) => s.user);
  const today = todayInTz(user?.timezone || 'UTC');

  const tasks = useTasks({});
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const [filter, setFilter] = useState('open'); // open | done | all
  const [modal, setModal] = useState(null); // null | 'new' | task

  const groups = useMemo(() => {
    const all = tasks.data?.tasks || [];
    const filtered = all.filter((t) =>
      filter === 'all' ? true : filter === 'done' ? t.completed : !t.completed,
    );
    return {
      overdue: filtered.filter((t) => t.dueDate && t.dueDate < today),
      today: filtered.filter((t) => t.dueDate === today),
      upcoming: filtered.filter((t) => t.dueDate && t.dueDate > today),
      undated: filtered.filter((t) => !t.dueDate),
    };
  }, [tasks.data, filter, today]);

  async function save(values) {
    if (modal === 'new') await createTask.mutateAsync(values);
    else await updateTask.mutateAsync({ id: modal.id, ...values });
    setModal(null);
  }

  const total =
    groups.overdue.length + groups.today.length + groups.upcoming.length + groups.undated.length;

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Tasks</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Keep it short — a list you can actually finish.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModal('new')}
          className="rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-600"
        >
          + New task
        </button>
      </header>

      <div className="flex gap-2">
        {[
          ['open', 'Open'],
          ['done', 'Done'],
          ['all', 'All'],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={[
              'rounded-full px-4 py-1.5 text-sm font-bold transition',
              filter === value
                ? 'bg-brand-100 text-brand-800 dark:bg-brand-900/60 dark:text-brand-200'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400',
            ].join(' ')}
          >
            {label}
          </button>
        ))}
      </div>

      {tasks.isLoading ? (
        <div className="h-32 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
      ) : total === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center dark:border-slate-700">
          <div className="text-3xl" aria-hidden>🕊️</div>
          <p className="mt-2 font-bold">
            {filter === 'done' ? 'Nothing finished yet.' : 'All clear.'}
          </p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {filter === 'done'
              ? 'Completed tasks will collect here.'
              : 'Add one task when something comes up.'}
          </p>
        </div>
      ) : (
        <>
          <Section title={`Overdue · ${groups.overdue.length}`} count={groups.overdue.length}>
            {groups.overdue.map((task) => (
              <TaskRow key={task.id} task={task} today={today} onToggle={(t) => updateTask.mutate({ id: t.id, completed: !t.completed })} onEdit={setModal} onDelete={(t) => deleteTask.mutate(t.id)} />
            ))}
          </Section>
          <Section title={`Today · ${formatFriendly(today)}`} count={groups.today.length}>
            {groups.today.map((task) => (
              <TaskRow key={task.id} task={task} today={today} onToggle={(t) => updateTask.mutate({ id: t.id, completed: !t.completed })} onEdit={setModal} onDelete={(t) => deleteTask.mutate(t.id)} />
            ))}
          </Section>
          <Section title={`Upcoming · ${groups.upcoming.length}`} count={groups.upcoming.length}>
            {groups.upcoming.map((task) => (
              <TaskRow key={task.id} task={task} today={today} onToggle={(t) => updateTask.mutate({ id: t.id, completed: !t.completed })} onEdit={setModal} onDelete={(t) => deleteTask.mutate(t.id)} />
            ))}
          </Section>
          <Section title="No date" count={groups.undated.length}>
            {groups.undated.map((task) => (
              <TaskRow key={task.id} task={task} today={today} onToggle={(t) => updateTask.mutate({ id: t.id, completed: !t.completed })} onEdit={setModal} onDelete={(t) => deleteTask.mutate(t.id)} />
            ))}
          </Section>
        </>
      )}

      <Modal
        open={modal !== null}
        onClose={() => setModal(null)}
        title={modal === 'new' ? 'New task' : 'Edit task'}
      >
        {modal && (
          <TaskForm
            initial={
              modal === 'new'
                ? { ...EMPTY, dueDate: addDays(today, 0) }
                : {
                    title: modal.title,
                    dueDate: modal.dueDate || '',
                    priority: modal.priority,
                  }
            }
            onSubmit={save}
            onCancel={() => setModal(null)}
            busy={createTask.isPending || updateTask.isPending}
          />
        )}
      </Modal>
    </div>
  );
}
