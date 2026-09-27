import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/auth';
import { browserTimezone } from '../lib/dates';

function timezones() {
  if (typeof Intl.supportedValuesOf === 'function') {
    const list = Intl.supportedValuesOf('timeZone');
    return list.includes('UTC') ? ['UTC', ...list] : ['UTC', ...list];
  }
  return [
    'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
    'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Madrid', 'Asia/Tokyo',
    'Asia/Shanghai', 'Asia/Kolkata', 'Australia/Sydney',
  ];
}

function Card({ title, description, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-base font-extrabold">{title}</h2>
      {description && (
        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{description}</p>
      )}
      <div className="mt-4">{children}</div>
    </section>
  );
}

const inputCls =
  'w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-950';

export default function Settings() {
  const user = useAuth((s) => s.user);
  const updateProfile = useAuth((s) => s.updateProfile);
  const logout = useAuth((s) => s.logout);
  const deleteAccount = useAuth((s) => s.deleteAccount);
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || '');
  const [timezone, setTimezone] = useState(user?.timezone || browserTimezone());
  const [saved, setSaved] = useState('');
  const [error, setError] = useState('');
  const [zones, setZones] = useState([]);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [dark, setDark] = useState(document.documentElement.classList.contains('dark'));

  useEffect(() => {
    setZones(timezones());
  }, []);

  useEffect(() => {
    if (!saved) return undefined;
    const t = setTimeout(() => setSaved(''), 2500);
    return () => clearTimeout(t);
  }, [saved]);

  async function saveProfile(e) {
    e.preventDefault();
    setError('');
    try {
      await updateProfile({ name, timezone });
      setSaved('Saved');
    } catch (err) {
      setError(err.message);
    }
  }

  function toggleTheme(next) {
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
    setDark(next);
  }

  async function onLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  async function onDelete() {
    setDeleting(true);
    try {
      await deleteAccount();
      navigate('/login', { replace: true });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <header>
        <h1 className="text-2xl font-extrabold">Settings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Your data stays private — never sold, never shared.
        </p>
      </header>

      <Card title="Profile" description="Used for greetings and computing your local “today”.">
        <form onSubmit={saveProfile} className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-bold text-slate-600 dark:text-slate-300">Name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-bold text-slate-600 dark:text-slate-300">Timezone</span>
            <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className={inputCls}>
              {zones.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
            <span className="mt-1 block text-xs text-slate-400">
              Your days are counted in this timezone, not the server's.
            </span>
          </label>

          {error && (
            <p role="alert" className="text-sm font-semibold text-amber-600 dark:text-amber-400">
              {error}
            </p>
          )}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-600"
            >
              Save
            </button>
            {saved && <span className="text-sm font-bold text-brand-600 dark:text-brand-400">{saved}</span>}
          </div>
        </form>
      </Card>

      <Card title="Appearance" description="Dark mode is easier on the eyes for evening journaling.">
        <div className="flex items-center justify-between rounded-xl bg-sand-100 px-4 py-3 dark:bg-slate-800">
          <span className="text-sm font-bold">Dark mode</span>
          <button
            type="button"
            role="switch"
            aria-checked={dark}
            aria-label="Toggle dark mode"
            onClick={() => toggleTheme(!dark)}
            className={[
              'relative h-7 w-12 rounded-full transition',
              dark ? 'bg-brand-500' : 'bg-slate-300 dark:bg-slate-600',
            ].join(' ')}
          >
            <span
              className={[
                'absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all',
                dark ? 'left-[22px]' : 'left-0.5',
              ].join(' ')}
            />
          </button>
        </div>
      </Card>

      <Card title="Account">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold">{user?.email}</p>
              <p className="text-xs text-slate-400">Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}</p>
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Sign out
            </button>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/60 dark:bg-amber-950/40">
            <p className="text-sm font-bold text-amber-800 dark:text-amber-300">Delete account</p>
            <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
              Permanently removes your habits, logs, tasks and profile. This cannot be undone.
            </p>
            <div className="mt-3 flex gap-2">
              <input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Type DELETE"
                aria-label="Type DELETE to confirm"
                className="min-w-0 flex-1 rounded-xl border border-amber-300 bg-white px-3 py-2 text-sm outline-none focus:border-amber-500 dark:border-amber-800 dark:bg-slate-950"
              />
              <button
                type="button"
                disabled={confirmText !== 'DELETE' || deleting}
                onClick={onDelete}
                className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-bold text-white hover:bg-amber-700 disabled:opacity-40"
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
