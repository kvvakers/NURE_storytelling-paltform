import { defineStore } from 'pinia';

interface UserState {
  _isAuthorized: boolean;
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    _isAuthorized: true,
  }),
  getters: {
    isAuthorized():boolean {
        return this._isAuthorized;
    }
  },
  actions: {},
});