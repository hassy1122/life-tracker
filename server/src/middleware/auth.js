import { verifyAccessToken } from '../lib/tokens.js';
import User from '../models/User.js';

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Authentication required' });

    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub);
    if (!user) return res.status(401).json({ error: 'Authentication required' });

    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: 'Authentication required' });
  }
}
