<template>
  <header class="header">
    <div class="header-container _container _flex _ai-c _jc-sb">
      <div class="_flex _flex-full _gap-x-32">
        <div class="logo _flex _ai-c _gap-8 _shrink-0">
          <img src="../assets/logo.svg" alt="Logo" class="logo-img" />
          <span class="logo-text">Storytelling</span>
        </div>

        <div class="search-bar _flex _ai-c _flex-full">
          <input
            v-model="searchQuery"
            @keyup.enter="search"
            type="text"
            placeholder="Пошук історій..."
            class="search-input"
          />
        </div>
      </div>

      <div v-if="userStore.isAuthorized" class="actions _flex _gap-8 _shrink-0">
        <button class="btn btn-secondary" @click="handleWrite">Написати</button>
        <button class="btn btn-secondary" @click="showLogoutModal = true">Вихід</button>
        <RouterLink :to="{ name: RouteName.MY_PROFILE }" class="profile _flex _ai-c">
          <div class="profile-img">
            <img :src="resolveMedia(userStore.user?.avatar)" alt="Avatar">
          </div>
          <div class="profile-name">{{ userStore.user?.username || userStore.user?.email }}</div>
        </RouterLink>
      </div>

      <div v-else class="actions _flex _gap-8 _shrink-0">
        <button class="btn btn-primary" @click="handleWrite">Написати</button>
        <button class="btn btn-secondary" @click="handleLogin">Вхід</button>
        <button class="btn btn-signup" @click="handleSignUp">Реєстрація</button>
      </div>
    </div>
  </header>

  <!-- Модалка підтвердження виходу -->
  <Teleport to="body">
    <div v-if="showLogoutModal" class="modal-overlay" @click.self="showLogoutModal = false">
      <div class="modal">
        <h2 class="modal-title">Вихід з акаунту</h2>
        <p class="modal-text">Ви впевнені, що хочете вийти?</p>
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="showLogoutModal = false">Скасувати</button>
          <button class="btn btn-danger-solid" @click="confirmLogout">Вийти</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { RouteName } from "../router/keys";
import { useUserStore } from "../stores/user";
import { resolveMedia } from "../utils/resolveMedia";

const userStore = useUserStore();
const searchQuery = ref("");
const router = useRouter();
const showLogoutModal = ref(false);
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

const confirmLogout = () => {
  showLogoutModal.value = false;
  handleLogout();
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
  gap: 2rem;
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
.profile-img {
  width: 30px;
  height: 30px;
  background-color: #28a745;
  border-radius: 50%;
  margin-right: 8px;
  overflow: hidden;
}
.profile-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
