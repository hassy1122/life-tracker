import { NavLink } from 'react-router-dom';
import { useAuth } from '../store/auth';

const links = [
  { to: '/', label: 'Today', end: true },
  { to: '/habits', label: 'Habits' },
  { to: '/tasks', label: 'Tasks' },
  { to: '/settings', label: 'Settings' },
];

function isDark() {
  return document.documentElement.classList.contains('dark');
}

function ThemeToggle() {
  return (
    <button
      type="button"
      aria-label={isDark() ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={() => {
        const dark = isDark();
        document.documentElement.classList.toggle('dark', !dark);
        localStorage.setItem('theme', dark ? 'light' : 'dark');
      }}
      className="rounded-full p-2 text-lg transition hover:bg-slate-100 dark:hover:bg-slate-800"
    >
      {isDark() ? '☀️' : '🌙'}
    </button>
  );
}

export default function Layout({ children }) {
  const user = useAuth((s) => s.user);
  const initials = (user?.name || '?')
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/85 backdrop-blur dark:border-slate-800 dark:bg-slate-900/85">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
          <NavLink to="/" className="flex items-center gap-2 text-lg font-extrabold tracking-tight">
            <span aria-hidden>🌱</span>
            <span className="hidden sm:inline">Life Tracker</span>
          </NavLink>

          <nav className="ml-auto flex items-center gap-1 overflow-x-auto">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  [
                    'rounded-full px-3 py-1.5 text-sm font-semibold whitespace-nowrap transition',
                    isActive
                      ? 'bg-brand-100 text-brand-800 dark:bg-brand-900/60 dark:text-brand-200'
                      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200',
                  ].join(' ')
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-1">
            <ThemeToggle />
            <NavLink
              to="/settings"
              aria-label="Settings"
              className="hidden h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-xs font-bold text-white sm:flex"
            >
              {initials || '?'}
            </NavLink>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 pb-24">{children}</main>
    </div>
  );
}
