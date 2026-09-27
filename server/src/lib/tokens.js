import jwt from 'jsonwebtoken';

const ACCESS_TTL = process.env.ACCESS_TOKEN_TTL || '15m';
const REFRESH_TTL = process.env.REFRESH_TOKEN_TTL || '30d';

function accessSecret() {
  return process.env.JWT_ACCESS_SECRET || 'dev_access_secret_change_me';
}

function refreshSecret() {
  return process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret_change_me';
}

export function signAccessToken(userId) {
  return jwt.sign({ sub: userId.toString(), type: 'access' }, accessSecret(), {
    expiresIn: ACCESS_TTL,
  });
}

export function signRefreshToken(userId) {
  return jwt.sign({ sub: userId.toString(), type: 'refresh' }, refreshSecret(), {
    expiresIn: REFRESH_TTL,
  });
}

export function verifyAccessToken(token) {
  const payload = jwt.verify(token, accessSecret());
  if (payload.type !== 'access') throw new Error('wrong token type');
  return payload;
}

export function verifyRefreshToken(token) {
  const payload = jwt.verify(token, refreshSecret());
  if (payload.type !== 'refresh') throw new Error('wrong token type');
  return payload;
}

export const REFRESH_COOKIE = 'lt_refresh';
