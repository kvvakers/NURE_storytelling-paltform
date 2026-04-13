<template>
  <div class="profile-page">
    <div v-if="isLoading" class="loading-state">Завантаження профілю...</div>
    <div v-else-if="errorMessage" class="error-state">{{ errorMessage }}</div>
    <template v-else>
      <header class="profile-header">
        <div class="profile-main _flex _gap-40 _ai-fs">
          <img :src="resolveMedia(profile.avatar) || 'https://via.placeholder.com/150'" :alt="profile.username || profile.email" class="profile-avatar" />
          
          <div class="profile-info">
            <div class="profile-title _flex _ai-c _gap-20">
              <h1 class="nickname">{{ profile.username || profile.email }}</h1>
              <button v-if="isCurrentUser" class="btn btn-secondary" @click="openEdit">Редагувати профіль</button>
              <button v-else class="btn btn-primary">Підписатися +</button>
            </div>

            <div class="stats _flex _gap-30">
              <div class="stat-item"><b>{{ authorStories.length }}</b> праць</div>
            </div>

            <div class="bio">
              <p>{{ profile.bio || 'Немає опису' }}</p>
              <span class="reg-date">З {{ formatDate(profile.createdAt) }}</span>
            </div>
          </div>
        </div>
      </header>

      <hr class="divider" />

      <section class="user-stories">
        <h3 class="section-title">Праці автора</h3>
        <div v-if="authorStories.length === 0" class="loading-state">Поки немає опублікованих праць.</div>
        <div class="stories-grid">
          <div v-for="story in authorStories" :key="story.id">
            <Card :story="story"/>
          </div>
        </div>
      </section>
    </template>

    <!-- Edit modal -->
    <div v-if="showEditModal" class="modal-overlay" @click.self="closeEdit">
      <div class="modal">
        <h2 class="modal-title">Редагувати профіль</h2>
        <div class="form-group">
          <label>Нікнейм</label>
          <input v-model="editForm.username" type="text" class="form-input" placeholder="username" />
        </div>
        <div class="form-group">
          <label>Біографія</label>
          <textarea v-model="editForm.bio" class="form-input form-textarea" placeholder="Розкажіть про себе..."></textarea>
        </div>
        <div class="form-group">
          <label>Аватар</label>
          <div class="avatar-upload">
            <img v-if="avatarPreview || editForm.avatar" :src="avatarPreview || resolveMedia(editForm.avatar)" class="avatar-preview" />
            <label class="avatar-upload-btn">
              Вибрати файл
              <input type="file" accept="image/*" class="avatar-file-input" @change="onAvatarFileChange" />
            </label>
          </div>
        </div>
        <div v-if="editError" class="error-state">{{ editError }}</div>
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="closeEdit" :disabled="isSaving">Скасувати</button>
          <button class="btn btn-primary" @click="saveProfile" :disabled="isSaving">
            {{ isSaving ? 'Збереження...' : 'Зберегти' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import { formatDate } from "../utils/formatDate";
import Card from "../components/Card.vue";
import { useRoute } from "vue-router";
import { api } from "../utils/api";
import { useUserStore } from "../stores/user";
import { resolveMedia } from "../utils/resolveMedia";

const route = useRoute();
const userStore = useUserStore();

const profile = ref({});
const authorStories = ref([]);
const isLoading = ref(true);
const errorMessage = ref(null);

const showEditModal = ref(false);
const isSaving = ref(false);
const editError = ref(null);
const editForm = reactive({ username: '', bio: '', avatar: '' });
const avatarPreview = ref(null);
const avatarFile = ref(null);

const parsedParamId = computed(() => {
  const raw = route.params.id;
  if (!raw || raw === 'undefined') return null;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
});
const isOwnProfile = computed(() => !parsedParamId.value || parsedParamId.value === userStore.user?.id);
const isCurrentUser = computed(() => userStore.isAuthorized && isOwnProfile.value);

onMounted(async () => {
  const useMe = isOwnProfile.value && userStore.isAuthorized;
  if (!useMe && !parsedParamId.value) {
    errorMessage.value = 'Профіль не знайдено';
    isLoading.value = false;
    return;
  }
  try {
    if (useMe) {
      // Дані вже свіжі зі стору (loadAuth викликав refreshUser)
      profile.value = { ...userStore.user };
    } else {
      profile.value = await api.get(`/users/${parsedParamId.value}`);
    }
    const ownerId = profile.value.id;
    const allStories = await api.get('/stories');
    authorStories.value = allStories.filter(s => s.ownerId === ownerId);
  } catch (e) {
    errorMessage.value = 'Не вдалося завантажити профіль';
  } finally {
    isLoading.value = false;
  }
});

function openEdit() {
  editForm.username = profile.value.username || '';
  editForm.bio = profile.value.bio || '';
  editForm.avatar = profile.value.avatar || '';
  avatarPreview.value = null;
  avatarFile.value = null;
  editError.value = null;
  showEditModal.value = true;
}

function onAvatarFileChange(e) {
  const file = e.target.files[0];
  if (!file) return;
  avatarFile.value = file;
  avatarPreview.value = URL.createObjectURL(file);
}

function closeEdit() {
  showEditModal.value = false;
}

async function saveProfile() {
  isSaving.value = true;
  editError.value = null;
  try {
    let updated = await api.patch('/users/me', {
      username: editForm.username || undefined,
      bio: editForm.bio || undefined,
    });

    if (avatarFile.value) {
      const formData = new FormData();
      formData.append('avatar', avatarFile.value);
      updated = await api.post('/users/me/avatar', formData);
    }

    profile.value = updated;
    if (userStore.user) {
      userStore.setAuth(userStore.token, { ...userStore.user, username: updated.username, avatar: updated.avatar });
    }
    closeEdit();
  } catch (e) {
    editError.value = e.data?.message || e.message || 'Помилка збереження';
  } finally {
    isSaving.value = false;
  }
}
</script>

<style scoped>
.profile-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
}

.profile-header {
  margin-bottom: 40px;
}

.profile-avatar {
  width: 180px;
  height: 180px;
  border-radius: 50%;
  object-fit: cover;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.profile-info { flex: 1; }

.profile-title {
  margin-bottom: 20px;
}

.nickname {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
}

.stats {
  margin-bottom: 20px;
}

.stat-item { font-size: 16px; }

.bio {
  line-height: 1.6;
  color: #444;
}

.reg-date {
  display: block;
  margin-top: 10px;
  font-size: 13px;
  color: #888;
}

.divider {
  border: 0;
  border-top: 1px solid #eee;
  margin: 40px 0;
}

.section-title {
  margin-bottom: 24px;
  font-size: 20px;
}

.avatar-preview {
  width: 72px;
  height: 72px;
}
</style>