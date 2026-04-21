<template>
  <div class="notifications-page _page">
    <div class="_container">
      <div class="notifications-header _flex _ai-c _jc-sb">
        <h1>Сповіщення</h1>
        <button
          v-if="notifications.length > 0"
          class="btn btn-secondary _flex _ai-c _gap-6"
          @click="markAllRead"
        >
          <CheckCheck :size="16" />Позначити всі як прочитані
        </button>
      </div>

      <div v-if="loading" class="empty-state">Завантаження...</div>

      <div v-else-if="notifications.length === 0" class="empty-state">
        У вас поки немає сповіщень
      </div>

      <div v-else class="notifications-list _flex _flex-col _gap-12">
        <div
          v-for="n in notifications"
          :key="n.id"
          class="notification-item panel _flex _ai-c _gap-16"
          :class="{ unread: !n.read }"
          @click="handleClick(n)"
        >
          <div class="notification-icon _shrink-0"><MessageSquare :size="22" /></div>
          <div class="notification-body _flex-1">
            <p class="notification-message">{{ n.message }}</p>
            <span class="notification-date">{{ formatDate(n.createdAt) }}</span>
          </div>
          <div v-if="!n.read" class="unread-dot _shrink-0"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { RouteName } from '../router/keys';
import { api } from '../utils/api';
import { MessageSquare, CheckCheck } from "lucide-vue-next";

interface Notification {
  id: number;
  type: string;
  message: string;
  storyId?: number;
  chapterIndex?: number;
  read: boolean;
  createdAt: string;
}

const router = useRouter();
const notifications = ref<Notification[]>([]);
const loading = ref(true);

const loadNotifications = async () => {
  try {
    const data = await api.get('/notifications');
    notifications.value = Array.isArray(data) ? data : [];
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};

onMounted(loadNotifications);

const handleClick = async (n: Notification) => {
  if (!n.read) {
    try {
      await api.patch(`/notifications/${n.id}/read`, {});
      n.read = true;
    } catch (e) {
      console.error(e);
    }
  }
  if (n.storyId != null && n.chapterIndex != null) {
    router.push({
      name: RouteName.READ_CHAPTER,
      params: { id: n.storyId, chapterIndex: n.chapterIndex },
    });
  }
};

const markAllRead = async () => {
  try {
    await api.patch('/notifications/read-all', {});
    notifications.value.forEach(n => { n.read = true; });
  } catch (e) {
    console.error(e);
  }
};

const formatDate = (date: string) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('uk-UA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};
</script>

<style scoped>
.notifications-page {
  background: #f9f9f9;
}

.notifications-header {
  margin-bottom: 32px;
}

.notifications-header h1 {
  margin: 0;
  font-size: 1.8rem;
  color: #222;
}

.notification-item {
  padding: 16px 20px;
  cursor: pointer;
  transition: background 0.15s;
  position: relative;
}

.notification-item:hover {
  background: #f0f4ff;
}

.notification-item.unread {
  border-left: 4px solid var(--color-primary);
}

.notification-icon {
  color: var(--color-primary);
}

.notification-message {
  margin: 0 0 4px;
  color: var(--color-text);
  font-size: 0.97rem;
  line-height: 1.5;
}

.notification-date {
  font-size: 0.8rem;
  color: #999;
}

.unread-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--color-primary);
}
</style>
