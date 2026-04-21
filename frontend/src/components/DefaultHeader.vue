<template>
  <header class="header">
    <div class="header-container _container _flex _ai-c _jc-sb">
      <div class="_flex _flex-full _gap-x-32">
        <RouterLink to="/"  class="logo _flex _ai-c _gap-8 _shrink-0">
          <img src="../assets/logo.svg" alt="Logo" class="logo-img" />
          <span class="logo-text">Storytelling</span>
        </RouterLink>

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
          
        <RouterLink :to="{ name: RouteName.NOTIFICATIONS }" class="notif-bell" title="Сповіщення">
          <span class="bell-icon">🔔</span>
          <span v-if="unreadCount > 0" class="badge">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
        </RouterLink>
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
import { ref, watch, onMounted, onUnmounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { RouteName } from "../router/keys";
import { useUserStore } from "../stores/user";
import { resolveMedia } from "../utils/resolveMedia";
import { api } from "../utils/api";

const userStore = useUserStore();
const searchQuery = ref("");
const router = useRouter();
const route = useRoute();
const showLogoutModal = ref(false);
const unreadCount = ref(0);
let pollInterval: ReturnType<typeof setInterval> | null = null;

const fetchUnreadCount = async () => {
  if (!userStore.isAuthorized) { unreadCount.value = 0; return; }
  try {
    const data = await api.get('/notifications/unread-count');
    unreadCount.value = data?.count ?? 0;
  } catch {
    unreadCount.value = 0;
  }
};

onMounted(() => {
  fetchUnreadCount();
  pollInterval = setInterval(fetchUnreadCount, 30_000);
});

onUnmounted(() => {
  if (pollInterval) clearInterval(pollInterval);
});

watch(() => userStore.isAuthorized, (authorized) => {
  if (authorized) fetchUnreadCount();
  else unreadCount.value = 0;
});

watch(() => route.fullPath, fetchUnreadCount);

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

/* Notification bell */
.notif-bell {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  text-decoration: none;
  transition: background 0.15s;
}
.notif-bell:hover {
  background: #f0f0f0;
}
.bell-icon {
  font-size: 1.2rem;
  line-height: 1;
}
.badge {
  position: absolute;
  top: 2px;
  right: 2px;
  background: #e53935;
  color: white;
  font-size: 0.6rem;
  font-weight: 700;
  min-width: 16px;
  height: 16px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 3px;
  line-height: 1;
}
</style>
