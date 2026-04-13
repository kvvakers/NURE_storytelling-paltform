<template>
  <div class="auth-page">
    <div class="auth-card">
      <h1>Вхід</h1>
      <form @submit.prevent="submitLogin" class="auth-form">
        <label>
          Email
          <input type="email" v-model="email" required />
        </label>
        <label>
          Пароль
          <input type="password" v-model="password" required />
        </label>
        <button type="submit" class="btn btn-primary">Увійти</button>
        <p class="auth-note">
          Немаєе аккаунту? <router-link :to="{ name: RouteName.REGISTER }">Зареєструватися</router-link>
        </p>
        <p v-if="error" class="auth-error">{{ error }}</p>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { RouteName } from '../router/keys';
import { useUserStore } from '../stores/user';
import { api } from '../utils/api';

const router = useRouter();
const userStore = useUserStore();
const email = ref('');
const password = ref('');
const error = ref('');

const submitLogin = async () => {
  error.value = '';

  try {
    const data = await api.post('/auth/login', { email: email.value, password: password.value }, { auth: false });
    userStore.setAuth(data.access_token, data.user);
    router.push({ name: RouteName.HOME });
  } catch (err) {
    console.error(err);
    error.value = 'Не вдалося увійти. Перевірте дані та спробуйте ще раз.';
  }
};
</script>

