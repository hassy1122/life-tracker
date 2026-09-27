import { Router } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';
import {
  REFRESH_COOKIE,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../lib/tokens.js';

const router = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function refreshCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/api/auth',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  };
}

function issueTokens(res, user) {
  const accessToken = signAccessToken(user._id);
  const refreshToken = signRefreshToken(user._id);
  res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions());
  return accessToken;
}

function validateTimezone(timezone) {
  if (!timezone || typeof timezone !== 'string') return 'UTC';
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: timezone });
    return timezone;
  } catch {
    return 'UTC';
  }
}

router.post('/signup', async (req, res) => {
  const { name, email, password, timezone } = req.body || {};
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Name is required' });
  }
  if (!email || !EMAIL_RE.test(String(email))) {
    return res.status(400).json({ error: 'A valid email is required' });
  }
  if (!password || String(password).length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  const normalizedEmail = String(email).toLowerCase().trim();
  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) return res.status(409).json({ error: 'An account with that email already exists' });

  const passwordHash = await bcrypt.hash(String(password), 10);
  const user = await User.create({
    name: String(name).trim(),
    email: normalizedEmail,
    passwordHash,
    timezone: validateTimezone(timezone),
  });

  const accessToken = issueTokens(res, user);
  res.status(201).json({ user: user.toSafeJSON(), accessToken });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = await User.findOne({ email: String(email).toLowerCase().trim() });
  const ok = user && (await bcrypt.compare(String(password), user.passwordHash));
  if (!ok) return res.status(401).json({ error: 'Invalid email or password' });

  const accessToken = issueTokens(res, user);
  res.json({ user: user.toSafeJSON(), accessToken });
});

router.post('/refresh', async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (!token) return res.status(401).json({ error: 'No refresh token' });
  try {
    const payload = verifyRefreshToken(token);
    const user = await User.findById(payload.sub);
    if (!user) return res.status(401).json({ error: 'No refresh token' });
    const accessToken = issueTokens(res, user);
    res.json({ user: user.toSafeJSON(), accessToken });
  } catch {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
  res.json({ ok: true });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user.toSafeJSON() });
});

router.put('/me', requireAuth, async (req, res) => {
  const { name, timezone } = req.body || {};
  if (name !== undefined) {
    if (typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Name cannot be empty' });
    }
    req.user.name = name.trim().slice(0, 80);
  }
  if (timezone !== undefined) req.user.timezone = validateTimezone(timezone);
  await req.user.save();
  res.json({ user: req.user.toSafeJSON() });
});

router.delete('/me', requireAuth, async (req, res) => {
  const userId = req.user._id;
  const [{ default: Habit }, { default: HabitLog }, { default: Task }] = await Promise.all([
    import('../models/Habit.js'),
    import('../models/HabitLog.js'),
    import('../models/Task.js'),
  ]);
  await Promise.all([
    Habit.deleteMany({ userId }),
    HabitLog.deleteMany({ userId }),
    Task.deleteMany({ userId }),
    User.deleteOne({ _id: userId }),
  ]);
  res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
  res.json({ ok: true });
});

export default router;
