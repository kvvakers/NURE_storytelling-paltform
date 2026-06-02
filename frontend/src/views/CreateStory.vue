<template>
  <div class="create-story _page">
    <div class="_container">
      <h1 class="_h1">Створити історію</h1>

      <form @submit.prevent="submitStory" class="form panel">
        <!-- Cover Image -->
        <div class="form-group">
          <label for="cover">Обкладинка</label>
          <div class="image-upload">
            <div v-if="isUploadingCover" class="upload-placeholder _flex _flex-col _ai-c _jc-c">
              <p>Завантаження...</p>
            </div>
            <div v-else-if="previewImage" class="image-preview">
              <img :src="previewImage" :alt="formData.title || 'Preview'" />
              <button type="button" @click="removeCover" class="btn-remove _flex _ai-c _jc-c">✕</button>
            </div>
            <div v-else class="upload-placeholder _flex _flex-col _ai-c _jc-c">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
              <p>Завантажте обкладинку</p>
            </div>
            <input
              id="cover"
              type="file"
              accept="image/*"
              @change="handleImageUpload"
              class="file-input"
            />
          </div>
        </div>

        <!-- Title -->
        <div class="form-group">
          <label for="title">Название</label>
          <input
            id="title"
            v-model="formData.title"
            type="text"
            placeholder="Введіть назву історії"
            required
            class="form-input"
          />
        </div>

        <!-- Description -->
        <div class="form-group">
          <label for="description">Опис</label>
          <textarea
            id="description"
            v-model="formData.description"
            placeholder="Опишіть вашу історію"
            rows="6"
            required
            class="form-input form-textarea"
          ></textarea>
        </div>

        <!-- Main Characters -->
        <div class="form-group">
          <label for="characters">Головні персонажі</label>
          <input
            id="characters"
            v-model="formData.characters"
            type="text"
            placeholder="Персонажі через кому (наприклад: Іван, Марія, Петро)"
            class="form-input"
          />
        </div>

        <!-- Categories (Genres) -->
        <div class="form-group">
          <label>Категорія (жанр)</label>
          <div class="checkbox-group _gap-12">
            <label v-for="genre in availableGenres" :key="genre" class="checkbox-label _flex _ai-c">
              <input
                type="checkbox"
                :value="genre"
                v-model="formData.genres"
                class="checkbox-input"
              />
              <span>{{ genre }}</span>
            </label>
          </div>
        </div>

        <!-- Tags -->
        <div class="form-group">
          <label for="tags">Теги</label>
          <input
            id="tags"
            v-model="formData.tags"
            type="text"
            placeholder="Теги через кому (наприклад: фантастика, пригода, любов)"
            class="form-input"
          />
          <div class="tags-preview _flex _flex-wrap _gap-8">
            <span v-for="tag in parsedTags" :key="tag" class="badge-primary _flex _ai-c _gap-6">
              {{ tag }}
              <button
                type="button"
                @click="removeTag(tag)"
                class="tag-remove"
              >×</button>
            </span>
          </div>
        </div>

        <!-- Language -->
        <div class="form-group">
          <label for="language">Мова</label>
          <select v-model="formData.language" id="language" class="form-input" required>
            <option value="">Виберіть мову</option>
            <option value="uk">Українська</option>
            <option value="ru">Русский</option>
            <option value="en">English</option>
            <option value="de">Deutsch</option>
            <option value="fr">Français</option>
            <option value="es">Español</option>
          </select>
        </div>

        <!-- Series -->
        <div class="form-group">
          <div class="series-header _flex _ai-c _jc-sb">
            <label>Серія</label>
            <button type="button" class="btn btn-secondary btn-sm" @click="openCreateSeriesModal">
              Створити серію
            </button>
          </div>
          <div class="series-list">
            <p v-if="seriesList.length === 0" class="series-empty">Серій поки нема</p>
            <label
              v-for="series in seriesList"
              :key="series.id"
              class="series-option _flex _ai-c"
            >
              <input
                type="radio"
                :value="series.id"
                v-model="formData.seriesId"
                class="radio-input"
              />
              <span>{{ series.title }}</span>
            </label>
            <label v-if="seriesList.length > 0" class="series-option _flex _ai-c">
              <input
                type="radio"
                :value="null"
                v-model="formData.seriesId"
                class="radio-input"
              />
              <span class="text-muted">Без серії</span>
            </label>
          </div>
        </div>

        <!-- Co-Authors -->
        <div class="form-group" v-if="socialUsers.length > 0">
          <label>Запросити співавторів</label>
          <p class="hint-text">Оберіть користувачів зі своїх підписок чи підписників, яких хочете запросити як співавторів.</p>
          <div class="coauthor-search">
            <input
              v-model="coauthorSearch"
              type="text"
              placeholder="Пошук за ім'ям..."
              class="form-input"
            />
          </div>
          <div class="coauthor-list">
            <label
              v-for="u in filteredSocialUsers"
              :key="u.id"
              class="coauthor-option _flex _ai-c"
            >
              <input
                type="checkbox"
                :value="u.id"
                v-model="selectedInvitees"
                class="checkbox-input"
              />
              <img :src="resolveMedia(u.avatar) || 'https://via.placeholder.com/32'" class="coauthor-avatar" :alt="u.username || u.email" />
              <span>{{ u.username || u.email }}</span>
            </label>
          </div>
          <div v-if="selectedInvitees.length > 0" class="selected-invitees _flex _flex-wrap _gap-8">
            <span
              v-for="id in selectedInvitees"
              :key="id"
              class="badge-primary _flex _ai-c _gap-6"
            >
              {{ getUserName(id) }}
              <button type="button" class="tag-remove" @click="selectedInvitees = selectedInvitees.filter(i => i !== id)">×</button>
            </span>
          </div>
        </div>

        <!-- Submit Button -->
        <div class="form-actions _flex _gap-12">
          <button type="submit" class="btn btn-primary btn-lg _flex-1">Опубликовать историю</button>
          <router-link :to="{ name: RouteName.HOME }" class="btn btn-secondary btn-lg _flex-1 _jc-c">
            Отмена
          </router-link>
        </div>
      </form>
    </div>
  </div>

  <!-- Create Series Modal -->
  <Teleport to="body">
    <div v-if="showCreateSeriesModal" class="modal-overlay" @click.self="closeCreateSeriesModal">
      <div class="modal">
        <div class="modal-header _flex _ai-c _jc-sb">
          <h2 class="modal-title">Нова серія</h2>
          <button type="button" class="btn-close" @click="closeCreateSeriesModal">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label for="series-title">Назва серії</label>
            <input
              id="series-title"
              v-model="newSeriesTitle"
              type="text"
              placeholder="Введіть назву серії"
              class="form-input"
              @keydown.enter.prevent="submitCreateSeries"
            />
          </div>
        </div>
        <div class="modal-footer _flex _gap-12 _jc-e">
          <button type="button" class="btn btn-secondary" @click="closeCreateSeriesModal">Скасувати</button>
          <button
            type="button"
            class="btn btn-primary"
            :disabled="isCreatingSeries || !newSeriesTitle.trim()"
            @click="submitCreateSeries"
          >
            {{ isCreatingSeries ? 'Створення...' : 'Створити' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { RouteName } from "../router/keys";
import { useToast } from "../composables/useToast";
import { api } from "../utils/api";
import { resolveMedia } from "../utils/resolveMedia";
import { useUserStore } from "../stores/user";

interface SeriesItem {
  id: number;
  title: string;
}

interface SocialUser {
  id: number;
  username: string | null;
  email: string;
  avatar?: string | null;
}

const router = useRouter();
const userStore = useUserStore();
const { show: showToast } = useToast();
const previewImage = ref("");

const socialUsers = ref<SocialUser[]>([]);
const coauthorSearch = ref("");
const selectedInvitees = ref<number[]>([]);

const filteredSocialUsers = computed(() => {
  const q = coauthorSearch.value.trim().toLowerCase();
  if (!q) return socialUsers.value;
  return socialUsers.value.filter(u =>
    (u.username || u.email).toLowerCase().includes(q)
  );
});

const getUserName = (id: number) => {
  const u = socialUsers.value.find(u => u.id === id);
  return u ? (u.username || u.email) : String(id);
};

const availableGenres = [
  "Драма",
  "Романтика",
  "Фантастика",
  "Тайна",
  "Приключение",
  "Научная фантастика",
  "Ужас",
  "Комедия",
  "Детектив",
  "История"
];

const formData = ref({
  title: "",
  description: "",
  characters: "",
  genres: [] as string[],
  tags: "",
  language: "",
  cover: "",
  seriesId: null as number | null,
});

const parsedTags = ref<string[]>([]);
const isUploadingCover = ref(false);

const seriesList = ref<SeriesItem[]>([]);
const showCreateSeriesModal = ref(false);
const newSeriesTitle = ref("");
const isCreatingSeries = ref(false);

onMounted(async () => {
  try {
    seriesList.value = await api.get("/series");
  } catch {
    // not authenticated or error — leave list empty
  }

  if (userStore.isAuthorized && userStore.user?.id) {
    try {
      const uid = userStore.user.id;
      const [followers, following] = await Promise.all([
        api.get(`/users/${uid}/followers`),
        api.get(`/users/${uid}/following`),
      ]);
      const map = new Map<number, SocialUser>();
      for (const u of [...(followers ?? []), ...(following ?? [])]) {
        if (u.id !== uid) map.set(u.id, u);
      }
      socialUsers.value = [...map.values()];
    } catch {
      // not critical
    }
  }
});

const openCreateSeriesModal = () => {
  newSeriesTitle.value = "";
  showCreateSeriesModal.value = true;
};

const closeCreateSeriesModal = () => {
  showCreateSeriesModal.value = false;
};

const submitCreateSeries = async () => {
  if (!newSeriesTitle.value.trim()) return;
  isCreatingSeries.value = true;
  try {
    const created: SeriesItem = await api.post("/series", { title: newSeriesTitle.value.trim() });
    seriesList.value.push(created);
    formData.value.seriesId = created.id;
    closeCreateSeriesModal();
    showToast("Серію створено", "success");
  } catch {
    showToast("Помилка при створенні серії", "error");
  } finally {
    isCreatingSeries.value = false;
  }
};

const handleImageUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  previewImage.value = URL.createObjectURL(file);

  isUploadingCover.value = true;
  try {
    const formData2 = new FormData();
    formData2.append('cover', file);
    const res = await api.post('/stories/upload-cover', formData2);
    formData.value.cover = res.url;
    previewImage.value = resolveMedia(res.url);
  } catch (e) {
    showToast('Помилка завантаження обкладинки', 'error');
    previewImage.value = '';
    formData.value.cover = '';
  } finally {
    isUploadingCover.value = false;
  }
};

const removeCover = () => {
  previewImage.value = "";
  formData.value.cover = "";
};

const updateTags = () => {
  if (formData.value.tags.trim()) {
    parsedTags.value = formData.value.tags
      .split(",")
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
  } else {
    parsedTags.value = [];
  }
};

const removeTag = (tag: string) => {
  parsedTags.value = parsedTags.value.filter(t => t !== tag);
  formData.value.tags = parsedTags.value.join(", ");
};

const submitStory = async () => {
  updateTags();

  if (!formData.value.title.trim()) {
    showToast("Будь ласка, введіть назву", "warning");
    return;
  }

  if (!formData.value.description.trim()) {
    showToast("Будь ласка, введіть опис", "warning");
    return;
  }

  if (formData.value.genres.length === 0) {
    showToast("Будь ласка, виберіть принаймні один жанр", "warning");
    return;
  }

  if (!formData.value.language) {
    showToast("Будь ласка, виберіть мову", "warning");
    return;
  }

  try {
    const storyPayload: Record<string, any> = {
      title: formData.value.title,
      description: formData.value.description,
      characters: formData.value.characters,
      genres: formData.value.genres,
      tags: parsedTags.value,
      language: formData.value.language,
      cover: formData.value.cover,
    };

    if (formData.value.seriesId !== null) {
      storyPayload.seriesId = formData.value.seriesId;
    }

    const query: Record<string, string> = {
      storyData: JSON.stringify(storyPayload),
    };
    if (selectedInvitees.value.length > 0) {
      query.invitees = selectedInvitees.value.join(',');
    }
    router.push({ name: RouteName.WRITE_CHAPTER, query });
  } catch (error) {
    console.error("Error submitting story:", error);
    showToast("Ошибка при переходе к написанию главы", "error");
  }
};
</script>

<style scoped>
h1 {
  margin-bottom: 40px;
  text-align: center;
}

.form {
  max-width: 700px;
  margin: 0 auto;
  padding: 32px;
  box-shadow: none;
  border: 1px solid #e5e5e5;
}

.form-group {
  margin-bottom: 24px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: var(--color-text);
  font-size: 0.95rem;
}

.form-textarea {
  min-height: 120px;
}

/* Image Upload */
.image-upload {
  position: relative;
  cursor: pointer;
}

.image-preview {
  position: relative;
  width: 100%;
  max-width: 300px;
  margin: 0 auto;
}

.image-preview img {
  width: 100%;
  height: auto;
  border-radius: 8px;
  display: block;
}

.btn-remove {
  position: absolute;
  top: -10px;
  right: -10px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: var(--color-danger);
  color: white;
  border: none;
  cursor: pointer;
  font-size: 1.2rem;
  transition: background-color 0.3s ease;
}

.btn-remove:hover {
  background-color: var(--color-danger-hover);
}

.upload-placeholder {
  padding: 40px;
  border: 2px dashed var(--color-border);
  border-radius: 8px;
  background-color: #f9f9f9;
  transition: all 0.3s ease;
}

.upload-placeholder:hover {
  border-color: var(--color-primary);
  background-color: #f0f7ff;
}

.upload-placeholder svg {
  color: #999;
  margin-bottom: 12px;
}

.upload-placeholder p {
  color: var(--color-text-muted);
  margin: 0;
}

.file-input {
  position: absolute;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
  top: 0;
  left: 0;
}

.image-upload {
  position: relative;
}

/* Checkboxes */
.checkbox-group {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
}

.checkbox-label {
  cursor: pointer;
  padding: 8px;
  border-radius: var(--radius-sm);
  transition: background-color 0.2s ease;
}

.checkbox-label:hover {
  background-color: #f5f5f5;
}

.checkbox-input {
  width: 18px;
  height: 18px;
  margin-right: 8px;
  cursor: pointer;
  accent-color: var(--color-primary);
}

.checkbox-label span {
  color: var(--color-text);
}

/* Tags */
.tags-preview {
  margin-top: 12px;
}

.tag-remove {
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  font-size: 1.2rem;
  padding: 0;
  line-height: 1;
  transition: opacity 0.2s ease;
}

.tag-remove:hover {
  opacity: 0.7;
}

/* Form Actions */
.form-actions {
  margin-top: 32px;
}

/* Series */
.series-header {
  margin-bottom: 8px;
}

.series-header label {
  margin-bottom: 0;
}

.series-list {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.series-empty {
  color: var(--color-text-muted);
  font-size: 0.9rem;
  margin: 0;
}

.series-option {
  cursor: pointer;
  padding: 6px 8px;
  border-radius: var(--radius-sm);
  transition: background-color 0.2s ease;
  gap: 10px;
}

.series-option:hover {
  background-color: #f5f5f5;
}

.radio-input {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: var(--color-primary);
  flex-shrink: 0;
}

.text-muted {
  color: var(--color-text-muted);
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: var(--color-bg, #fff);
  border-radius: var(--radius-md, 8px);
  padding: 24px;
  width: 100%;
  max-width: 440px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.16);
}

.modal-title {
  font-size: 1.1rem;
  font-weight: 700;
  margin: 0;
}

.modal-header {
  margin-bottom: 20px;
}

.modal-body {
  margin-bottom: 20px;
}

.modal-body .form-group {
  margin-bottom: 0;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.1rem;
  cursor: pointer;
  color: var(--color-text-muted);
  padding: 4px;
  line-height: 1;
  transition: color 0.2s ease;
}

.btn-close:hover {
  color: var(--color-text);
}

.btn-sm {
  padding: 6px 12px;
  font-size: 0.85rem;
}

.hint-text {
  font-size: 0.85rem;
  color: var(--color-text-muted);
  margin: 0 0 10px;
}

.coauthor-search {
  margin-bottom: 10px;
}

.coauthor-list {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 8px;
  max-height: 180px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.coauthor-option {
  cursor: pointer;
  padding: 6px 8px;
  border-radius: var(--radius-sm);
  transition: background-color 0.2s ease;
  gap: 10px;
}

.coauthor-option:hover {
  background-color: #f5f5f5;
}

.coauthor-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.selected-invitees {
  margin-top: 10px;
}

@media (max-width: 768px) {
  .form {
    padding: 20px;
  }

  .checkbox-group {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  }

  .form-actions {
    flex-direction: column;
  }

  .modal {
    margin: 16px;
  }
}
</style>
