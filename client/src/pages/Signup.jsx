import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/auth';
import { browserTimezone } from '../lib/dates';

export default function Signup() {
  const signup = useAuth((s) => s.signup);
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    timezone: browserTimezone(),
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setBusy(true);
    try {
      await signup(form);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-sand-50 px-4 dark:bg-slate-950">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="text-4xl" aria-hidden>🌱</div>
          <h1 className="mt-2 text-2xl font-extrabold">Start tracking gently</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            One calm place for your habits, tasks and reflection.
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          {error && (
            <p role="alert" className="rounded-xl bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700 dark:bg-amber-950 dark:text-amber-300">
              {error}
            </p>
          )}

          <label className="block">
            <span className="mb-1 block text-sm font-bold text-slate-600 dark:text-slate-300">Name</span>
            <input
              required
              autoComplete="name"
              value={form.name}
              onChange={update('name')}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-950"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-bold text-slate-600 dark:text-slate-300">Email</span>
            <input
              type="email"
              required
              autoComplete="email"
              value={form.email}
              onChange={update('email')}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-950"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-bold text-slate-600 dark:text-slate-300">Password</span>
            <input
              type="password"
              required
              autoComplete="new-password"
              placeholder="At least 8 characters"
              value={form.password}
              onChange={update('password')}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-950"
            />
          </label>

          <input type="hidden" value={form.timezone} readOnly />

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-brand-500 py-2.5 font-bold text-white transition hover:bg-brand-600 disabled:opacity-60"
          >
            {busy ? 'Creating…' : 'Create account'}
          </button>

          <p className="text-center text-xs text-slate-400 dark:text-slate-500">
            Private by default — your entries are only ever yours.
          </p>
        </form>

        <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-brand-600 hover:underline dark:text-brand-400">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
