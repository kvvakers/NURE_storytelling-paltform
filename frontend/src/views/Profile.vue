<template>
  <div class="profile-page">
    <div v-if="isLoading" class="loading-state">Завантаження профілю...</div>
    <div v-else-if="errorMessage" class="error-state">{{ errorMessage }}</div>
    <template v-else>
      <header class="profile-header">
        <div class="profile-main _flex _gap-40 _ai-fs">
          <img :src="resolveMedia(profile.avatar) || 'https://via.placeholder.com/150'" :alt="profile.username || profile.email" class="profile-avatar" />

          <div class="profile-info _flex-1">
            <div class="profile-title _flex _ai-c _gap-20">
              <h1 class="nickname">{{ profile.username || profile.email }}</h1>
              <button v-if="isCurrentUser" class="btn btn-secondary" @click="openEdit">Редагувати профіль</button>
              <template v-else-if="userStore.isAuthorized">
                <button v-if="isFollowing" class="btn btn-secondary" @click="toggleFollow"><span>Відписатися</span></button>
                <button v-else class="btn btn-primary" @click="toggleFollow"><span>Підписатися +</span></button>
              </template>
            </div>

            <div class="stats _flex _gap-30">
              <div class="stat-item"><b>{{ authorStories.length }}</b> праць</div>
              <div class="stat-item author-link" @click="showFollowersModal = true">
                <b>{{ followers.length }}</b> підписників
              </div>
              <div class="stat-item author-link" @click="showFollowingModal = true">
                <b>{{ following.length }}</b> підписок
              </div>
            </div>

            <div class="bio">
              <p>{{ profile.bio || 'Немає опису' }}</p>
              <span class="reg-date">Працює з {{ formatDate(profile.createdAt) }}</span>
            </div>
          </div>
        </div>
      </header>

      <hr class="divider" />

      <!-- Tabs (only show library tab for own profile) -->
      <div class="tabs _flex _gap-4" :class="{ 'tabs-single': !isCurrentUser }">
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'works' }"
          @click="activeTab = 'works'"
        >Праці автора</button>
        <button
          v-if="isCurrentUser"
          class="tab-btn"
          :class="{ active: activeTab === 'library' }"
          @click="switchToLibrary"
        >Моя бібліотека</button>
      </div>

      <!-- Works tab -->
      <section v-if="activeTab === 'works'" class="user-stories">
        <div v-if="authorStories.length === 0" class="loading-state">Поки немає опублікованих праць.</div>
        <template v-else>
          <div v-for="group in seriesGroups" :key="group.id" class="series-group">
            <div class="series-group-header _flex _ai-c _gap-10">
              <span class="series-group-icon">⎘</span>
              <h4 class="series-group-title">{{ group.title }}</h4>
              <span class="series-group-count">{{ group.stories.length }} {{ group.stories.length === 1 ? 'частина' : 'частин' }}</span>
            </div>
            <div class="stories-grid">
              <div v-for="story in group.stories" :key="story.id">
                <Card :story="story" />
              </div>
            </div>
          </div>
          <div v-if="standaloneStories.length > 0">
            <h4 v-if="seriesGroups.length > 0" class="standalone-title">Окремі твори</h4>
            <div class="stories-grid">
              <div v-for="story in standaloneStories" :key="story.id">
                <Card :story="story" />
              </div>
            </div>
          </div>
        </template>
      </section>

      <!-- Library tab -->
      <section v-if="activeTab === 'library' && isCurrentUser" class="library-section">
        <div v-if="libraryLoading" class="loading-state">Завантаження бібліотеки...</div>
        <template v-else>
          <div class="library-header _flex _ai-c _jc-sb">
            <div class="library-categories _flex _gap-8 _flex-wrap">
              <button
                class="category-btn"
                :class="{ active: activeCategory === null }"
                @click="activeCategory = null"
              >Всі ({{ library.all.length }})</button>
              <button
                v-for="cat in library.categories"
                :key="cat.id"
                class="category-btn"
                :class="{ active: activeCategory === cat.id }"
                @click="activeCategory = cat.id"
              >{{ cat.title }} ({{ cat.stories.length }})</button>
            </div>
            <button class="btn btn-primary btn-sm" @click="openCreateCategory">+ Категорія</button>
          </div>

          <div class="library-content">
            <!-- "All" view -->
            <template v-if="activeCategory === null">
              <div v-if="library.all.length === 0" class="library-empty">
                <p>Бібліотека порожня.</p>
                <p v-if="library.categories.length === 0" class="hint-text">
                  Відкрийте будь-яку книгу й натисніть «Додати до бібліотеки».<br>
                  <button class="btn-link" @click="openCreateCategory">Створити категорію</button>, щоб організувати читання.
                </p>
              </div>
              <div v-else class="stories-grid">
                <div v-for="story in library.all" :key="story.id" class="story-card-wrapper">
                  <Card :story="story" />
                  <div class="story-card-footer">
                    <RouterLink
                      v-if="story.bookmarkChapterIndex != null"
                      :to="{ name: RouteName.READ_CHAPTER, params: { id: story.id, chapterIndex: story.bookmarkChapterIndex } }"
                      class="continue-reading-btn"
                    >▶ Продовжити читання</RouterLink>
                    <button class="remove-from-library-btn" title="Видалити з бібліотеки" @click.prevent="removeFromLibrary(story.id)">✕</button>
                  </div>
                </div>
              </div>
            </template>

            <!-- Specific category view -->
            <template v-else>
              <div v-for="cat in library.categories" :key="cat.id">
                <template v-if="cat.id === activeCategory">
                  <div v-if="cat.stories.length === 0" class="library-empty">
                    <p>У цій категорії ще немає книг.</p>
                    <p class="hint-text">Додайте книги зі сторінки твору.</p>
                  </div>
                  <div v-else class="stories-grid">
                    <div v-for="story in cat.stories" :key="story.id" class="story-card-wrapper">
                      <Card :story="story" />
                      <div class="story-card-footer">
                        <span></span>
                        <button class="remove-from-library-btn" title="Видалити з бібліотеки" @click.prevent="removeFromLibrary(story.id)">✕</button>
                      </div>
                    </div>
                  </div>
                </template>
              </div>
            </template>
          </div>
        </template>
      </section>
    </template>

    <!-- Edit profile modal -->
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

    <!-- Create category modal -->
    <div v-if="showCreateCategoryModal" class="modal-overlay" @click.self="showCreateCategoryModal = false">
      <div class="modal">
        <h2 class="modal-title">Нова категорія</h2>
        <div class="form-group">
          <label>Назва</label>
          <input
            v-model="newCategoryTitle"
            type="text"
            class="form-input"
            placeholder="Наприклад: Улюблені, Прочитати пізніше..."
            @keydown.enter.prevent="submitCreateCategory"
          />
        </div>
        <div v-if="createCategoryError" class="error-state">{{ createCategoryError }}</div>
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="showCreateCategoryModal = false">Скасувати</button>
          <button
            class="btn btn-primary"
            :disabled="isCreatingCategory || !newCategoryTitle.trim()"
            @click="submitCreateCategory"
          >{{ isCreatingCategory ? 'Створення...' : 'Створити' }}</button>
        </div>
      </div>
    </div>

    <!-- Followers modal -->
    <div v-if="showFollowersModal" class="modal-overlay" @click.self="showFollowersModal = false">
      <div class="modal">
        <h2 class="modal-title">Підписники ({{ followers.length }})</h2>
        <div v-if="followers.length === 0" class="modal-empty">Поки немає підписників</div>
        <div v-else class="user-list _flex _flex-col _gap-10">
          <div
            v-for="u in followers"
            :key="u.id"
            class="user-list-item _flex _ai-c _gap-12"
            @click="goToProfile(u.id)"
          >
            <img :src="resolveMedia(u.avatar)" class="user-list-avatar" alt="avatar" />
            <span class="user-list-name">{{ u.username || u.email }}</span>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="showFollowersModal = false">Закрити</button>
        </div>
      </div>
    </div>

    <!-- Following modal -->
    <div v-if="showFollowingModal" class="modal-overlay" @click.self="showFollowingModal = false">
      <div class="modal">
        <h2 class="modal-title">Підписки ({{ following.length }})</h2>
        <div v-if="following.length === 0" class="modal-empty">Поки немає підписок</div>
        <div v-else class="user-list _flex _flex-col">
          <div
            v-for="u in following"
            :key="u.id"
            class="user-list-item _flex _ai-c _gap-12"
            @click="goToProfile(u.id)"
          >
            <img :src="resolveMedia(u.avatar)" class="user-list-avatar" alt="avatar" />
            <span class="user-list-name">{{ u.username || u.email }}</span>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="showFollowingModal = false">Закрити</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from "vue";
import { formatDate } from "../utils/formatDate";
import Card from "../components/Card.vue";
import { useRoute, useRouter } from "vue-router";
import { api } from "../utils/api";
import { useUserStore } from "../stores/user";
import { resolveMedia } from "../utils/resolveMedia";
import { RouteName } from "../router/keys";

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const profile = ref({});
const authorStories = ref([]);
const isLoading = ref(true);
const errorMessage = ref(null);
const followers = ref([]);
const following = ref([]);
const isFollowing = ref(false);
const showFollowersModal = ref(false);
const showFollowingModal = ref(false);

const showEditModal = ref(false);
const isSaving = ref(false);
const editError = ref(null);
const editForm = reactive({ username: '', bio: '', avatar: '' });
const avatarPreview = ref(null);
const avatarFile = ref(null);

// Tabs
const activeTab = ref('works');

// Library
const libraryLoading = ref(false);
const library = ref({ all: [], categories: [] });
const activeCategory = ref(null);
const showCreateCategoryModal = ref(false);
const newCategoryTitle = ref('');
const isCreatingCategory = ref(false);
const createCategoryError = ref(null);

const parsedParamId = computed(() => {
  const raw = route.params.id;
  if (!raw || raw === 'undefined') return null;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
});
const isOwnProfile = computed(() => !parsedParamId.value || parsedParamId.value === userStore.user?.id);
const isCurrentUser = computed(() => userStore.isAuthorized && isOwnProfile.value);

const seriesGroups = computed(() => {
  const map = {};
  for (const story of authorStories.value) {
    if (story.seriesId && story.seriesTitle) {
      if (!map[story.seriesId]) {
        map[story.seriesId] = { id: story.seriesId, title: story.seriesTitle, stories: [] };
      }
      map[story.seriesId].stories.push(story);
    }
  }
  return Object.values(map);
});

const standaloneStories = computed(() =>
  authorStories.value.filter(s => !s.seriesId)
);

async function loadProfile() {
  isLoading.value = true;
  errorMessage.value = null;
  profile.value = {};
  authorStories.value = [];
  followers.value = [];
  following.value = [];
  isFollowing.value = false;
  activeTab.value = 'works';
  library.value = { all: [], categories: [] };
  activeCategory.value = null;

  const useMe = isOwnProfile.value && userStore.isAuthorized;
  if (!useMe && !parsedParamId.value) {
    errorMessage.value = 'Профіль не знайдено';
    isLoading.value = false;
    return;
  }
  try {
    if (useMe) {
      profile.value = await api.get('/users/me');
    } else {
      profile.value = await api.get(`/users/${parsedParamId.value}`);
    }
    const ownerId = profile.value.id;
    const [allStories, followersData, followingData] = await Promise.all([
      api.get('/stories'),
      api.get(`/users/${ownerId}/followers`),
      api.get(`/users/${ownerId}/following`),
    ]);
    authorStories.value = allStories.filter(s => s.ownerId === ownerId).map(story => ({
      ...story,
      created_at: story.createdAt ?? story.created_at,
    }));
    followers.value = Array.isArray(followersData) ? followersData : [];
    following.value = Array.isArray(followingData) ? followingData : [];

    if (!isOwnProfile.value && userStore.isAuthorized) {
      const status = await api.get(`/users/${ownerId}/follow-status`);
      isFollowing.value = status?.following ?? false;
    }
  } catch (e) {
    errorMessage.value = 'Не вдалося завантажити профіль';
  } finally {
    isLoading.value = false;
  }
}

async function loadLibrary() {
  if (!isCurrentUser.value) return;
  libraryLoading.value = true;
  try {
    library.value = await api.get('/library');
  } catch (e) {
    library.value = { all: [], categories: [] };
  } finally {
    libraryLoading.value = false;
  }
}

async function switchToLibrary() {
  activeTab.value = 'library';
  if (!library.value.all.length && !library.value.categories.length) {
    await loadLibrary();
  }
}

function openCreateCategory() {
  newCategoryTitle.value = '';
  createCategoryError.value = null;
  showCreateCategoryModal.value = true;
}

async function removeFromLibrary(storyId) {
  try {
    await api.del(`/library/${storyId}`);
    library.value.all = library.value.all.filter(s => s.id !== storyId);
    for (const cat of library.value.categories) {
      cat.stories = cat.stories.filter(s => s.id !== storyId);
    }
  } catch (e) {
    console.error(e);
  }
}

async function submitCreateCategory() {
  if (!newCategoryTitle.value.trim()) return;
  isCreatingCategory.value = true;
  createCategoryError.value = null;
  try {
    const created = await api.post('/library/categories', { title: newCategoryTitle.value.trim() });
    library.value.categories.push({ id: created.id, title: created.title, stories: [] });
    showCreateCategoryModal.value = false;
    activeCategory.value = created.id;
  } catch (e) {
    createCategoryError.value = e?.data?.message || 'Помилка створення';
  } finally {
    isCreatingCategory.value = false;
  }
}

onMounted(loadProfile);
watch(() => route.params.id, loadProfile);

async function toggleFollow() {
  const targetId = profile.value.id;
  if (!targetId) return;
  try {
    if (isFollowing.value) {
      await api.del(`/users/${targetId}/follow`);
      isFollowing.value = false;
      followers.value = followers.value.filter(f => f.id !== userStore.user?.id);
    } else {
      await api.post(`/users/${targetId}/follow`);
      isFollowing.value = true;
      if (userStore.user) {
        followers.value = [...followers.value, { id: userStore.user.id, username: userStore.user.username, email: userStore.user.email, avatar: userStore.user.avatar }];
      }
    }
  } catch (e) {
    console.error(e);
  }
}

function goToProfile(id) {
  showFollowersModal.value = false;
  showFollowingModal.value = false;
  router.push({ name: RouteName.PROFILE, params: { id } });
}

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

.modal-empty {
  color: #999;
  text-align: center;
  padding: 20px 0;
}

.user-list {
  max-height: 360px;
  overflow-y: auto;
  margin-bottom: 16px;
}

.user-list-item {
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s;
}
.user-list-item:hover { background: #f0f4ff; }

.user-list-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  background: #eee;
}

.user-list-name {
  font-size: 0.95rem;
  color: var(--color-text);
}

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

/* Tabs */
.tabs {
  margin-bottom: 28px;
  border-bottom: 2px solid #e8e8e8;
}

.tab-btn {
  background: none;
  border: none;
  padding: 10px 20px;
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-muted, #888);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  transition: color 0.15s, border-color 0.15s;
}

.tab-btn.active {
  color: var(--color-primary, #4f46e5);
  border-bottom-color: var(--color-primary, #4f46e5);
}

.tab-btn:hover:not(.active) {
  color: var(--color-text);
}

/* Library */
.library-section {
  margin-top: 0;
}

.library-header {
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 12px;
}

.library-categories {
  flex: 1;
}

.category-btn {
  background: #f0f0f0;
  border: 1px solid transparent;
  border-radius: 20px;
  padding: 6px 16px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
  color: var(--color-text);
}

.category-btn.active {
  background: var(--color-primary, #4f46e5);
  color: #fff;
  border-color: var(--color-primary, #4f46e5);
}

.category-btn:hover:not(.active) {
  background: #e0e0e0;
}

.library-empty {
  text-align: center;
  padding: 60px 20px;
  color: #888;
}

.library-empty p { margin: 6px 0; }

.hint-text {
  font-size: 14px;
  color: #aaa;
  line-height: 1.7;
}

.btn-link {
  background: none;
  border: none;
  color: var(--color-primary, #4f46e5);
  cursor: pointer;
  font-size: inherit;
  padding: 0;
  text-decoration: underline;
}

/* Stories grid (shared) */
.series-group {
  margin-bottom: 40px;
}

.series-group-header {
  margin-bottom: 16px;
  padding-bottom: 10px;
  border-bottom: 2px solid var(--color-primary, #4f46e5);
}

.series-group-icon {
  font-size: 1.1rem;
  color: var(--color-primary, #4f46e5);
}

.series-group-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text);
}

.series-group-count {
  font-size: 0.82rem;
  color: var(--color-text-muted, #888);
  background: #f0f0f0;
  padding: 2px 8px;
  border-radius: 10px;
}

.standalone-title {
  margin: 0 0 16px;
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text);
}

.avatar-preview {
  width: 72px;
  height: 72px;
}

.btn span {
  display: inline-block;
  width: 140px;
}

.btn-sm { padding: 6px 14px; font-size: 13px; }

.story-card-wrapper {
  position: relative;
}

.remove-from-library-btn {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: none;
  background: #fee2e2;
  color: #dc2626;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 0.15s;
}

.story-card-wrapper:hover .remove-from-library-btn {
  opacity: 1;
}

.story-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 8px 4px;
}

.continue-reading-btn {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-primary, #4f46e5);
  text-decoration: none;
  padding: 4px 8px;
  border-radius: 6px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  transition: background 0.15s;
}

.continue-reading-btn:hover {
  background: #dbeafe;
}
</style>
