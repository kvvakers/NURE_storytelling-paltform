import { defineStore } from 'pinia';

interface User {
  id: number;
  email: string;
  nickname?: string;
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
    loadAuth() {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) {
        return;
      }

      try {
        const parsed = JSON.parse(saved) as { token: string; user: User };
        this.token = parsed.token;
        this.user = parsed.user;
        this._isAuthorized = Boolean(parsed.token && parsed.user);
      } catch (error) {
        localStorage.removeItem(STORAGE_KEY);
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