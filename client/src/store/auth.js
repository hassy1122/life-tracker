import { create } from 'zustand';
import { api, setAccessToken } from '../lib/api';

export const useAuth = create((set) => ({
  user: null,
  status: 'loading', // 'loading' | 'authed' | 'guest'

  async init() {
    try {
      const data = await api('/auth/refresh', { method: 'POST', allowRefresh: false });
      setAccessToken(data.accessToken);
      set({ user: data.user, status: 'authed' });
    } catch {
      setAccessToken(null);
      set({ user: null, status: 'guest' });
    }
  },

  async login(email, password) {
    const data = await api('/auth/login', {
      method: 'POST',
      body: { email, password },
      allowRefresh: false,
    });
    setAccessToken(data.accessToken);
    set({ user: data.user, status: 'authed' });
  },

  async signup(payload) {
    const data = await api('/auth/signup', {
      method: 'POST',
      body: payload,
      allowRefresh: false,
    });
    setAccessToken(data.accessToken);
    set({ user: data.user, status: 'authed' });
  },

  async logout() {
    try {
      await api('/auth/logout', { method: 'POST', allowRefresh: false });
    } finally {
      setAccessToken(null);
      set({ user: null, status: 'guest' });
    }
  },

  async updateProfile(patch) {
    const data = await api('/auth/me', { method: 'PUT', body: patch });
    set({ user: data.user });
    return data.user;
  },

  async deleteAccount() {
    await api('/auth/me', { method: 'DELETE' });
    setAccessToken(null);
    set({ user: null, status: 'guest' });
  },
}));
