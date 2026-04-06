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

const router = useRouter();
const userStore = useUserStore();
const email = ref('');
const password = ref('');
const error = ref('');

const submitLogin = async () => {
  error.value = '';

  try {
    const response = await fetch('http://localhost:3000/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email.value,
        password: password.value,
      }),
    });

    if (!response.ok) {
      throw new Error('Невірний email або пароль');
    }

    const data = await response.json();
    userStore.setAuth(data.access_token, data.user);
    router.push({ name: RouteName.HOME });
  } catch (err) {
    console.error(err);
    error.value = 'Не вдалося увійти. Перевірте дані та спробуйте ще раз.';
  }
};
</script>

<style scoped>
.auth-page {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f5f8;
  padding: 0px 20px 180px;
  flex: 1 1 100%;
}

.auth-card {
  width: 100%;
  max-width: 420px;
  background: white;
  padding: 34px;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.08);
}

.auth-card h1 {
  margin-bottom: 24px;
  font-size: 2rem;
  margin-top: 0;
}

.auth-form {
  display: grid;
  gap: 18px;
}

label {
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: #333;
  font-weight: 600;
}

input {
  padding: 14px 16px;
  border: 1px solid #dcdcdc;
  border-radius: 10px;
  font-size: 1rem;
}

.btn {
  width: 100%;
  padding: 14px 16px;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-size: 1rem;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.auth-note {
  margin: 0;
  color: #666;
  text-align: center;
}

.auth-error {
  color: #d00;
  text-align: center;
  margin-top: 8px;
}
</style>
