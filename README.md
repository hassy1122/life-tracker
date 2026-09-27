# 🌱 Life Tracker

A calm, private place to see your daily actions and how you're actually feeling — instead of
three disconnected apps.

**Phase 1 (MVP) is implemented:** auth, timezone-aware habits with streaks, a task list, a
dashboard with quick stats, a GitHub-style consistency heatmap, dark mode, and full account
deletion.

## Stack

| Layer     | Choice                                              |
| --------- | --------------------------------------------------- |
| Frontend  | React 19 + Vite + Tailwind CSS 4 + Zustand + TanStack Query |
| Backend   | Node.js + Express 5 (ESM)                           |
| Database  | MongoDB + Mongoose                                  |
| Auth      | JWT access token (15 min) + httpOnly refresh cookie, bcrypt |
| Charts    | CSS-grid heatmap (Recharts arrives with the stats page) |

## Quick start

```bash
# 1. MongoDB (Docker)
docker compose up -d

# 2. Config
copy server\.env.example server\.env     # Windows
# cp server/.env.example server/.env     # macOS/Linux

# 3. Install & run both apps
npm install
npm run dev
```

* App: http://localhost:5173 (Vite proxies `/api` → the Express server)
* API: http://localhost:4000

No Docker? Point `MONGODB_URI` in `server/.env` at a MongoDB Atlas free-tier cluster instead.

### Scripts

| Command             | What it does                          |
| ------------------- | ------------------------------------- |
| `npm run dev`       | API + client together (concurrently)  |
| `npm run dev:server`| API only (`node --watch`)             |
| `npm run dev:client`| Client only (Vite)                    |
| `npm run build`     | Production build of the client        |
| `npm start`         | Start the API                         |

## Project structure

```
server/src/
  lib/dates.js      Timezone-aware "today", week math (user tz, never server tz)
  lib/streaks.js    Streak + weekly-progress rules (the core mechanic)
  lib/tokens.js     Access/refresh JWT issuing & verification
  middleware/auth.js
  models/           User, Habit, HabitLog, Task
  routes/           auth, habits, tasks, stats
client/src/
  lib/api.js        Fetch wrapper w/ transparent token refresh
  lib/dates.js      Same date rules on the client
  store/auth.js     Zustand auth state
  queries.js        TanStack Query hooks + invalidation
  components/       Layout, HabitRow, TaskRow, Heatmap, Modal
  pages/            Login, Signup, Dashboard, Habits, Tasks, Settings
```

## Streak & progress rules (Section 8 of the blueprint)

These are decided, implemented, and covered by tests — don't change one without the others:

1. **"Today" uses the user's stored timezone** (`user.timezone`), never the server's. A log at
   11:55pm counts for the day the user experienced.
2. **No grace days.** One missed scheduled day ends a daily streak.
3. **Today is always still open.** If today isn't logged yet, the streak counts through
   yesterday and is only broken once the day fully ends.
4. **`x_per_week` habits streak in weeks** (Monday-start): a week qualifies when
   `targetPerWeek` completions exist. The current in-progress week extends the streak only
   once the target is met, and never breaks it before the week ends.
5. **Backdating is allowed** (any date ≤ today). Streaks are recomputed from the full log set,
   so filling a forgotten day repairs the streak from that date forward.
6. **Stats are cached on write.** `habit.stats.{currentStreak,bestStreak}` are recomputed when
   a log changes or the schedule changes — reads never scan full history. Dashboard reads only
   fetch the current week's logs.

## API overview

```
POST   /api/auth/signup | login | refresh | logout
GET    /api/auth/me     PUT (name, timezone)   DELETE (full account deletion)
GET/POST         /api/habits
PUT/DELETE        /api/habits/:id              (delete = archive)
POST              /api/habits/:id/log          { date?, completed? } — backdating allowed
GET               /api/habits/:id/history      ?from&to
GET/POST          /api/tasks                   ?completed&from&to
PUT/DELETE        /api/tasks/:id
GET               /api/stats/summary           streaks, week rate, today progress
GET               /api/stats/heatmap?days=84   per-day completion intensity
```

## Privacy posture

* Every record is scoped to one `userId`; queries always filter by the authenticated owner
  (verified by test: a second account gets 404 on another user's data).
* Refresh tokens are httpOnly cookies; access tokens live only in memory.
* Full account deletion (`DELETE /api/auth/me`) removes habits, logs, tasks and the user.
* No third-party analytics anywhere in the codebase.

## Roadmap status

- [x] **Phase 1 — MVP:** auth, habits + streaks + timezone logic, tasks, dashboard, heatmap
- [ ] **Phase 2 — Reflection & Goals:** journal/mood log, goals with milestones, combined calendar
- [ ] **Phase 3 — Insight:** stats charts (Recharts), custom metrics, auto weekly review
- [ ] **Phase 4 — Engagement:** Wheel of Life, badges, journal prompts, notifications
- [ ] **Phase 5 — Depth:** PWA/offline, data export, accountability sharing, health integrations

## Testing

End-to-end API tests (timezone "today", streak edge cases, weekly habits, task CRUD, refresh
flow, ownership isolation, account deletion) were run against a live server + MongoDB during
build. The core streak logic lives in `server/src/lib/streaks.js` and is designed to be unit
tested directly if you want to add a test runner (vitest/node:test) in Phase 2.
