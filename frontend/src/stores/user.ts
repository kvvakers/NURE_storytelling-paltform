import { defineStore } from 'pinia';

const API_BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

interface User {
  id: number;
  email: string;
  username?: string;
  avatar?: string;
}

interface UserState {
  token: string | null;
  user: User | null;
  _isAuthorized: boolean;
}

const STORAGE_KEY = 'storytelling_user_auth';

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    token: null,
    user: null,
    _isAuthorized: false,
  }),
  getters: {
    isAuthorized(): boolean {
      return this._isAuthorized;
    },
  },
  actions: {
    async loadAuth() {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return;

      try {
        const parsed = JSON.parse(saved) as { token: string; user: User };
        this.token = parsed.token;
        this.user = parsed.user;
        this._isAuthorized = Boolean(parsed.token && parsed.user);

        // Перевіряємо токен і оновлюємо дані з сервера
        await this.refreshUser();
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    },
    async refreshUser() {
      if (!this.token) return;
      try {
        const res = await fetch(`${API_BASE}/users/me`, {
          headers: { Authorization: `Bearer ${this.token}` },
        });
        if (res.status === 401) {
          this.logout();
          return;
        }
        if (res.ok) {
          const data: User = await res.json();
          this.user = data;
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: this.token, user: data }));
        }
      } catch {
        // сеть недоступна — оставляем кешированные данные
      }
    },
    setAuth(token: string, user: User) {
      this.token = token;
      this.user = user;
      this._isAuthorized = true;
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, user }));
    },
    logout() {
      this.token = null;
      this.user = null;
      this._isAuthorized = false;
      localStorage.removeItem(STORAGE_KEY);
    },
  },
});