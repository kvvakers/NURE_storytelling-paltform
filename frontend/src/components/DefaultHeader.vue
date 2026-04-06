<template>
  <header class="header">
    <div class="header-container _container">
      <div class="_flex _flex-full _gap-x-32">
        <div class="logo">
          <img src="../assets/logo.svg" alt="Logo" class="logo-img" />
          <span class="logo-text">Storytelling</span>
        </div>

        <div class="search-bar">
          <input
            v-model="searchQuery"
            @keyup.enter="search"
            type="text"
            placeholder="Пошук історій..."
            class="search-input"
          />
        </div>
      </div>

      <div v-if="userStore.isAuthorized" class="actions">
        <button class="btn btn-secondary" @click="handleWrite">Написати</button>
        <button class="btn btn-secondary" @click="handleLogout">Вихід</button>
        <RouterLink :to="{ name: RouteName.PROFILE, params: { nickname: userStore.user?.email || 'profile' } }" class="profile _flex _ai-c">
          <div class="profile-img"></div>
          <div class="profile-name">{{ userStore.user?.email }}</div>
        </RouterLink>
      </div>

      <div v-else class="actions">
        <button class="btn btn-primary" @click="handleWrite">Написати</button>
        <button class="btn btn-secondary" @click="handleLogin">Вхід</button>
        <button class="btn btn-signup" @click="handleSignUp">Реєстрація</button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { RouteName } from "../router/keys";
import { useUserStore } from "../stores/user";

const userStore = useUserStore();
const searchQuery = ref("");
const router = useRouter();
const search = () => {
  if (searchQuery.value.trim()) {
    router.push({ name: RouteName.SEARCH, params: { query: searchQuery.value.trim() } });
  }
};

const handleWrite = () => {
  router.push({ name: RouteName.CREATE_STORY });
};

const handleLogin = () => {
  router.push({ name: RouteName.LOGIN });
};

const handleSignUp = () => {
  router.push({ name: RouteName.REGISTER });
};

const handleLogout = () => {
  userStore.logout();
  router.push({ name: RouteName.HOME });
};
</script>

<style scoped>
.header {
  background-color: #fff;
  border-bottom: 1px solid #e0e0e0;
  padding: 1rem 0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.logo-img {
  height: 40px;
  width: auto;
}

.logo-text {
  font-size: 1.5rem;
  font-weight: 700;
  color: #333;
}

.search-bar {
  max-width: 600px;
  flex: 1 1 auto;
  display: flex;
  align-items: center;
  background-color: #f5f5f5;
  border-radius: 24px;
  padding: 0.5rem 1rem;
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font-size: 1rem;
}

.search-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.2rem;
}

.actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

.btn-signup {
  background-color: #28a745;
  color: white;
}

.btn-signup:hover {
  background-color: #218838;
}
.profile-img {
  width: 30px;
  height: 30px;
  background-color: #28a745;
  border-radius: 50%;
  margin-right: 8px;
}
</style>
