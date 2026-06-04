<template>
  <div class="edit-story _page">
    <div class="_container">
      <h1 class="_h1">Редагувати історію</h1>

      <div v-if="loading" class="loading-state">Завантаження...</div>

      <form v-else-if="story" @submit.prevent="submitEdit" class="form panel">
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
          <label for="title">Назва</label>
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
            @input="updateTags"
          />
          <div class="tags-preview _flex _flex-wrap _gap-8">
            <span v-for="tag in parsedTags" :key="tag" class="badge-primary _flex _ai-c _gap-6">
              {{ tag }}
              <button type="button" @click="removeTag(tag)" class="tag-remove">×</button>
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

        <!-- Status -->
        <div class="form-group">
          <label for="status">Статус</label>
          <select v-model="formData.status" id="status" class="form-input">
            <option v-for="opt in STATUS_OPTIONS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
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

        <!-- Co-Authors (only owner can manage) -->
        <div class="form-group" v-if="story.isMine">
          <label>Співавтори</label>
          <div v-if="story.coAuthors?.length" class="coauthors-current _flex _flex-wrap _gap-8">
            <span
              v-for="ca in story.coAuthors"
              :key="ca.id"
              class="badge-primary _flex _ai-c _gap-6"
            >
              {{ ca.username || ca.email }}
              <button type="button" class="tag-remove" @click="removeCoAuthor(ca.id)">×</button>
            </span>
          </div>
          <div class="coauthor-search">
            <input
              v-model="coauthorSearch"
              type="text"
              placeholder="Пошук за іменем автора..."
              class="form-input"
              @input="onCoauthorSearchInput"
            />
          </div>
          <div v-if="coauthorSearchResults.length > 0" class="coauthor-list">
            <div
              v-for="u in coauthorSearchResults"
              :key="u.id"
              class="coauthor-option _flex _ai-c _jc-sb"
            >
              <div class="_flex _ai-c _gap-8">
                <img :src="resolveMedia(u.avatar) || placeholderAvatar" class="coauthor-avatar" :alt="u.username || u.email" />
                <span>{{ u.username || u.email }}</span>
              </div>
              <button
                type="button"
                class="btn btn-secondary btn-sm"
                :disabled="coauthorInvited.includes(u.id)"
                @click="inviteCoAuthor(u.id)"
              >{{ coauthorInvited.includes(u.id) ? 'Надіслано' : 'Запросити' }}</button>
            </div>
          </div>
          <div v-else-if="coauthorSearch.trim() && !coauthorSearchLoading" class="coauthor-empty">Нікого не знайдено</div>
        </div>

        <div v-if="saveError" class="error-state">{{ saveError }}</div>

        <!-- Submit Button -->
        <div class="form-actions _flex _gap-12">
          <button type="submit" class="btn btn-primary btn-lg _flex-1" :disabled="isSaving || isUploadingCover">
            {{ isSaving ? 'Збереження...' : 'Зберегти зміни' }}
          </button>
          <button type="button" class="btn btn-secondary btn-lg _flex-1" @click="goBack">
            Скасувати
          </button>
        </div>
      </form>

      <div v-else class="not-found">Історія не знайдена</div>
    </div>
  </div>

  <!-- Create Series Modal -->
  <Teleport to="body">
    <div v-if="showCreateSeriesModal" class="modal-overlay" @click.self="showCreateSeriesModal = false">
      <div class="modal">
        <div class="modal-header _flex _ai-c _jc-sb">
          <h2 class="modal-title">Нова серія</h2>
          <button type="button" class="btn-close" @click="showCreateSeriesModal = false">✕</button>
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
          <button type="button" class="btn btn-secondary" @click="showCreateSeriesModal = false">Скасувати</button>
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
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { RouteName } from "../router/keys";
import { useToast } from "../composables/useToast";
import { api } from "../utils/api";
import { resolveMedia } from "../utils/resolveMedia";

const placeholderAvatar = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="%23ccc"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>';

interface SeriesItem {
  id: number;
  title: string;
}

interface CoAuthorUser {
  id: number;
  username: string | null;
  email: string;
  avatar?: string | null;
}

interface Story {
  id: number;
  title: string;
  description: string;
  characters?: string;
  genres: string[];
  tags: string[];
  language?: string;
  cover: string;
  seriesId?: number | null;
  status?: string;
  isMine?: boolean;
  coAuthors?: CoAuthorUser[];
}

const STATUS_OPTIONS = [
  { value: 'in_progress', label: 'В процесі' },
  { value: 'completed',   label: 'Завершено' },
  { value: 'frozen',      label: 'Заморожено' },
] as const;

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
  "История",
];

const route = useRoute();
const router = useRouter();
const { show: showToast } = useToast();

const story = ref<Story | null>(null);
const loading = ref(true);
const isSaving = ref(false);
const isUploadingCover = ref(false);
const saveError = ref('');
const previewImage = ref('');

const formData = ref({
  title: '',
  description: '',
  characters: '',
  genres: [] as string[],
  tags: '',
  language: '',
  cover: '',
  seriesId: null as number | null,
  status: 'in_progress',
});

const parsedTags = ref<string[]>([]);
const seriesList = ref<SeriesItem[]>([]);
const showCreateSeriesModal = ref(false);
const newSeriesTitle = ref('');
const isCreatingSeries = ref(false);

const coauthorSearch = ref('');
const coauthorSearchResults = ref<CoAuthorUser[]>([]);
const coauthorSearchLoading = ref(false);
const coauthorInvited = ref<number[]>([]);
let coauthorSearchTimer: ReturnType<typeof setTimeout> | null = null;

onMounted(async () => {
  const id = Number(route.params.id);
  if (!id) { loading.value = false; return; }
  try {
    const data: Story = await api.get(`/stories/${id}`);
    story.value = data;
    formData.value.title = data.title;
    formData.value.description = data.description;
    formData.value.characters = data.characters || '';
    formData.value.genres = [...(data.genres || [])];
    const tagsArr = data.tags || [];
    formData.value.tags = tagsArr.join(', ');
    parsedTags.value = [...tagsArr];
    formData.value.language = (data as any).language || '';
    formData.value.cover = data.cover || '';
    formData.value.seriesId = data.seriesId ?? null;
    formData.value.status = data.status || 'in_progress';
    if (data.cover) {
      previewImage.value = resolveMedia(data.cover);
    }
    seriesList.value = await api.get('/series');
  } catch {
    story.value = null;
  } finally {
    loading.value = false;
  }
});

const updateTags = () => {
  const raw = formData.value.tags;
  parsedTags.value = raw.trim()
    ? raw.split(',').map(t => t.trim()).filter(Boolean)
    : [];
};

const removeTag = (tag: string) => {
  parsedTags.value = parsedTags.value.filter(t => t !== tag);
  formData.value.tags = parsedTags.value.join(', ');
};

const handleImageUpload = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  previewImage.value = URL.createObjectURL(file);
  isUploadingCover.value = true;
  try {
    const fd = new FormData();
    fd.append('cover', file);
    const res = await api.post('/stories/upload-cover', fd);
    formData.value.cover = res.url;
    previewImage.value = resolveMedia(res.url);
  } catch {
    showToast('Помилка завантаження обкладинки', 'error');
    previewImage.value = '';
    formData.value.cover = '';
  } finally {
    isUploadingCover.value = false;
  }
};

const removeCover = () => {
  previewImage.value = '';
  formData.value.cover = '';
};

const openCreateSeriesModal = () => {
  newSeriesTitle.value = '';
  showCreateSeriesModal.value = true;
};

const submitCreateSeries = async () => {
  if (!newSeriesTitle.value.trim()) return;
  isCreatingSeries.value = true;
  try {
    const created: SeriesItem = await api.post('/series', { title: newSeriesTitle.value.trim() });
    seriesList.value.push(created);
    formData.value.seriesId = created.id;
    showCreateSeriesModal.value = false;
    showToast('Серію створено', 'success');
  } catch {
    showToast('Помилка при створенні серії', 'error');
  } finally {
    isCreatingSeries.value = false;
  }
};

const onCoauthorSearchInput = () => {
  if (coauthorSearchTimer) clearTimeout(coauthorSearchTimer);
  const q = coauthorSearch.value.trim();
  if (!q) { coauthorSearchResults.value = []; return; }
  coauthorSearchTimer = setTimeout(async () => {
    coauthorSearchLoading.value = true;
    try {
      const results: CoAuthorUser[] = await api.get(`/users/search?q=${encodeURIComponent(q)}`);
      const existingIds = new Set((story.value?.coAuthors ?? []).map(ca => ca.id));
      coauthorSearchResults.value = results.filter(u => !existingIds.has(u.id));
    } catch {
      coauthorSearchResults.value = [];
    } finally {
      coauthorSearchLoading.value = false;
    }
  }, 300);
};

const inviteCoAuthor = async (userId: number) => {
  if (!story.value) return;
  try {
    await api.post(`/stories/${story.value.id}/co-authors/invite`, { inviteeId: userId });
    coauthorInvited.value.push(userId);
  } catch (e: any) {
    showToast(e?.data?.message || 'Помилка при запрошенні', 'error');
  }
};

const removeCoAuthor = async (userId: number) => {
  if (!story.value) return;
  try {
    await api.del(`/stories/${story.value.id}/co-authors/${userId}`);
    if (story.value.coAuthors) {
      story.value.coAuthors = story.value.coAuthors.filter(ca => ca.id !== userId);
    }
  } catch (e: any) {
    showToast(e?.data?.message || 'Помилка при видаленні', 'error');
  }
};

const submitEdit = async () => {
  if (!story.value) return;
  updateTags();
  saveError.value = '';
  isSaving.value = true;
  try {
    await api.patch(`/stories/${story.value.id}`, {
      title: formData.value.title,
      description: formData.value.description,
      characters: formData.value.characters,
      genres: formData.value.genres,
      tags: parsedTags.value,
      language: formData.value.language,
      cover: formData.value.cover,
      seriesId: formData.value.seriesId,
      status: formData.value.status,
    });
    showToast('Історію збережено', 'success');
    router.push({ name: RouteName.STORY, params: { id: story.value.id } });
  } catch (e: any) {
    saveError.value = e?.data?.message || e?.message || 'Помилка збереження';
  } finally {
    isSaving.value = false;
  }
};

const goBack = () => {
  if (story.value) {
    router.push({ name: RouteName.STORY, params: { id: story.value.id } });
  } else {
    router.back();
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

.loading-state,
.not-found {
  text-align: center;
  padding: 60px 20px;
  font-size: 1.1rem;
  color: var(--color-text-muted);
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

.coauthors-current {
  margin-bottom: 12px;
}

.coauthor-search {
  margin-bottom: 10px;
}

.coauthor-list {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.coauthor-option {
  padding: 6px 8px;
  border-radius: var(--radius-sm);
  transition: background-color 0.2s ease;
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

.coauthor-empty {
  margin-top: 6px;
  font-size: 0.88rem;
  color: var(--color-text-muted);
}

.error-state {
  color: var(--color-danger, #dc2626);
  font-size: 0.9rem;
  margin-bottom: 16px;
  padding: 10px 14px;
  background: #fef2f2;
  border-radius: var(--radius-sm);
  border: 1px solid #fecaca;
}

.form-actions {
  margin-top: 32px;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 0.85rem;
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
