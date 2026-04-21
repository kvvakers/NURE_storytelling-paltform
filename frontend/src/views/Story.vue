<template>
  <div v-if="story" class="story-page _page">
    <div class="_container">
      <!-- Story Metadata -->
      <div class="story-metadata panel _flex _gap-x-32">
        <div>
          <img :src="resolveMedia(story.cover)" :alt="story.title" class="cover" />
        </div>
        <div class="story-info _flex-1">
          <h1 class="_h1">{{ story.title }}</h1>
          <p>
            <b>Автор:</b>
            <span
              v-if="story.ownerId"
              class="author-link"
              @click="router.push({ name: RouteName.PROFILE, params: { id: story.ownerId } })"
            >{{ story.author }}</span>
            <span v-else>{{ story.author }}</span>
          </p>
          <p><b>Опис:</b> {{ story.description }}</p>
          <p><b>Рейтинг:</b> {{ story.rating }}/10</p>
          <p><b>Дата публікації:</b> {{ new Date(story.createdAt).toLocaleDateString('uk-UA') }}</p>
          <div class="genres _flex _flex-wrap _gap-8">
            <span v-for="g in story.genres" :key="g" class="badge-primary">{{ g }}</span>
          </div>
          <div v-if="story.isMine" class="story-owner-actions _flex _gap-12">
            <button class="btn btn-secondary _flex _ai-c _gap-6" @click="openEditStory"><Pencil :size="15" />Редагувати</button>
            <button class="btn btn-danger _flex _ai-c _gap-6" @click="deleteStoryModal = true"><Trash2 :size="15" />Видалити</button>
          </div>
        </div>
      </div>

      <!-- Chapters list -->
      <div class="chapters-section panel">
        <div class="chapters-header _flex _ai-c _jc-sb">
          <h2>Глави ({{ chapters.length }})</h2>
          <button v-if="story.isMine" type="button" class="btn btn-primary _flex _ai-c _gap-6" @click="goToAddChapter">
            <Plus :size="16" />Додати главу
          </button>
        </div>

        <div v-if="chapters.length === 0" class="no-chapters">
          Глав ще немає.
        </div>

        <div v-else class="chapter-list _flex _flex-col _gap-12">
          <div v-for="(ch, idx) in chapters" :key="idx" class="chapter-card _flex-col _ai-fs">
            <div class="chapter-card-main _flex _flex-col _gap-4 _flex-1 _min-w-0" @click="goToRead(idx)">
              <span class="chapter-number">Глава {{ idx + 1 }}</span>
              <span class="chapter-title">{{ ch.title }}</span>
              <span class="chapter-preview">{{ stripHtml(ch.content).slice(0, 120) }}{{ ch.content.length > 120 ? '…' : '' }}</span>
            </div>
            <div v-if="story.isMine" class="chapter-card-actions _flex _gap-8 _shrink-0 _jc-fe">
              <button
                type="button"
                class="btn btn-secondary _flex _ai-c _gap-6"
                @click.stop="editChapter(idx)"
                title="Редагувати"
              >
                <Pencil :size="14" />Редагувати
              </button>
              <button
                type="button"
                class="btn btn-danger _flex _ai-c _gap-6"
                @click.stop="confirmDeleteChapter(idx)"
                title="Видалити"
              >
                <Trash2 :size="14" />Видалити
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div v-else class="not-found">
    <p>Історія не знайдена</p>
  </div>

  <!-- Confirm Delete Story Modal -->
  <teleport to="body">
    <div v-if="deleteStoryModal" class="modal-overlay" @click.self="deleteStoryModal = false">
      <div class="modal">
        <h3 class="modal-title">Видалити історію?</h3>
        <p class="modal-text">«{{ story?.title }}» буде видалено безповоротно разом з усіма главами.</p>
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="deleteStoryModal = false">Скасувати</button>
          <button class="btn btn-danger" @click="executeDeleteStory">Видалити</button>
        </div>
      </div>
    </div>
  </teleport>

  <!-- Edit Story Modal -->
  <teleport to="body">
    <div v-if="editStoryModal" class="modal-overlay" @click.self="editStoryModal = false">
      <div class="modal modal-wide">
        <h3 class="modal-title">Редагувати історію</h3>

        <div class="edit-form _flex _flex-col _gap-14">
          <!-- Cover -->
          <div class="form-group">
            <label>Обкладинка</label>
            <div class="avatar-upload">
              <img v-if="editStory.coverPreview || editStory.cover" :src="editStory.coverPreview || resolveMedia(editStory.cover)" class="cover-preview" />
              <label class="avatar-upload-btn">
                Вибрати файл
                <input type="file" accept="image/*" class="avatar-file-input" @change="onEditCoverChange" :disabled="editStory.isUploadingCover" />
              </label>
              <span v-if="editStory.isUploadingCover" style="font-size:13px;color:#888">Завантаження...</span>
            </div>
          </div>
          <!-- Title -->
          <div class="form-group">
            <label>Назва</label>
            <input v-model="editStory.title" type="text" class="form-input" />
          </div>
          <!-- Description -->
          <div class="form-group">
            <label>Опис</label>
            <textarea v-model="editStory.description" class="form-input form-textarea"></textarea>
          </div>
          <!-- Characters -->
          <div class="form-group">
            <label>Персонажі</label>
            <input v-model="editStory.characters" type="text" class="form-input" />
          </div>
          <!-- Genres -->
          <div class="form-group">
            <label>Жанри (через кому)</label>
            <input v-model="editStory.genresRaw" type="text" class="form-input" />
          </div>
          <!-- Tags -->
          <div class="form-group">
            <label>Теги (через кому)</label>
            <input v-model="editStory.tagsRaw" type="text" class="form-input" />
          </div>
          <!-- Language -->
          <div class="form-group">
            <label>Мова</label>
            <select v-model="editStory.language" class="form-input">
              <option value="uk">Українська</option>
              <option value="ru">Русский</option>
              <option value="en">English</option>
              <option value="de">Deutsch</option>
              <option value="fr">Français</option>
              <option value="es">Español</option>
            </select>
          </div>
        </div>

        <div v-if="editStory.error" class="error-state">{{ editStory.error }}</div>
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="editStoryModal = false" :disabled="editStory.isSaving">Скасувати</button>
          <button class="btn btn-primary" @click="saveEditStory" :disabled="editStory.isSaving || editStory.isUploadingCover">
            {{ editStory.isSaving ? 'Збереження...' : 'Зберегти' }}
          </button>
        </div>
      </div>
    </div>
  </teleport>

  <!-- Confirm Delete Chapter Modal -->
  <teleport to="body">
    <div v-if="deleteModal.visible" class="modal-overlay" @click.self="deleteModal.visible = false">
      <div class="modal">
        <h3 class="modal-title">Видалити главу?</h3>
        <p class="modal-text">«{{ deleteModal.chapterTitle }}» буде видалено безповоротно.</p>
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="deleteModal.visible = false">Скасувати</button>
          <button class="btn btn-danger" @click="executeDelete">Видалити</button>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
// import { useUserStore } from "../stores/user";
import { useToast } from "../composables/useToast";
import { RouteName } from "../router/keys";
import { api } from '../utils/api';
import { resolveMedia } from '../utils/resolveMedia';
import { Pencil, Trash2, Plus } from "lucide-vue-next";

interface Chapter {
  title: string;
  content: string;
}

interface Story {
  id: number;
  title: string;
  author: string;
  description: string;
  rating: number;
  createdAt: string;
  cover: string;
  genres: string[];
  chapters: Chapter[];
  ownerId?: number;
  isMine?: boolean;
}

const route = useRoute();
const router = useRouter();
// const userStore = useUserStore();
const { show: showToast } = useToast();

const deleteModal = ref({ visible: false, chapterIndex: -1, chapterTitle: "" });
const deleteStoryModal = ref(false);

const editStoryModal = ref(false);
const editStory = ref({
  title: '',
  description: '',
  characters: '',
  genresRaw: '',
  tagsRaw: '',
  language: '',
  cover: '',
  coverPreview: '',
  isUploadingCover: false,
  isSaving: false,
  error: '',
});

const story = ref<Story | null>(null);
const chapters = ref<Chapter[]>([]);

const loadStory = async () => {
  story.value = null;
  const id = Number(route.params.id);
  if (!id) return;
  try {
    const data = await api.get(`/stories/${id}`);
    story.value = data;
    chapters.value = data.chapters || [];
  } catch (e) {
    console.error(e);
  }
};

onMounted(loadStory);
watch(() => route.params.id, loadStory);

const executeDeleteStory = async () => {
  if (!story.value) return;
  deleteStoryModal.value = false;
  try {
    await api.del(`/stories/${story.value.id}`);
    showToast('Історію видалено', 'success');
    router.push({ name: RouteName.HOME });
  } catch (e) {
    console.error(e);
    showToast('Помилка при видаленні', 'error');
  }
};

const openEditStory = () => {
  if (!story.value) return;
  editStory.value.title = story.value.title;
  editStory.value.description = story.value.description;
  editStory.value.characters = (story.value as any).characters || '';
  editStory.value.genresRaw = (story.value.genres || []).join(', ');
  editStory.value.tagsRaw = ((story.value as any).tags || []).join(', ');
  editStory.value.language = (story.value as any).language || '';
  editStory.value.cover = story.value.cover;
  editStory.value.coverPreview = '';
  editStory.value.error = '';
  editStoryModal.value = true;
};

const onEditCoverChange = async (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  editStory.value.coverPreview = URL.createObjectURL(file);
  editStory.value.isUploadingCover = true;
  try {
    const fd = new FormData();
    fd.append('cover', file);
    const res = await api.post('/stories/upload-cover', fd);
    editStory.value.cover = res.url;
    editStory.value.coverPreview = (await import('../utils/resolveMedia')).resolveMedia(res.url);
  } catch {
    showToast('Помилка завантаження обкладинки', 'error');
    editStory.value.coverPreview = '';
  } finally {
    editStory.value.isUploadingCover = false;
  }
};

const saveEditStory = async () => {
  if (!story.value) return;
  editStory.value.isSaving = true;
  editStory.value.error = '';
  try {
    const payload: Record<string, any> = {
      title: editStory.value.title,
      description: editStory.value.description,
      characters: editStory.value.characters,
      genres: editStory.value.genresRaw.split(',').map(s => s.trim()).filter(Boolean),
      tags: editStory.value.tagsRaw.split(',').map(s => s.trim()).filter(Boolean),
      language: editStory.value.language,
      cover: editStory.value.cover,
    };
    const updated = await api.patch(`/stories/${story.value.id}`, payload);
    Object.assign(story.value, updated);
    editStoryModal.value = false;
    showToast('Історію збережено', 'success');
  } catch (e: any) {
    editStory.value.error = e?.data?.message || e?.message || 'Помилка збереження';
  } finally {
    editStory.value.isSaving = false;
  }
};

const goToRead = (idx: number) => {
  if (!story.value) return;
  router.push({ name: RouteName.READ_CHAPTER, params: { id: story.value.id, chapterIndex: idx } });
};

const goToAddChapter = () => {
  if (!story.value) return;
  router.push({
    name: RouteName.WRITE_CHAPTER,
    query: { storyId: String(story.value.id), storyTitle: story.value.title },
  });
};

const editChapter = (idx: number) => {
  if (!story.value) return;
  const chapter = chapters.value[idx];
  if (!chapter) return;
  router.push({
    name: RouteName.WRITE_CHAPTER,
    query: {
      storyId: String(story.value.id),
      storyTitle: story.value.title,
      chapterIndex: String(idx),
      chapterTitle: chapter.title,
      chapterContent: chapter.content,
    },
  });
};

const confirmDeleteChapter = (idx: number) => {
  if (!story.value) return;
  const chapter = chapters.value[idx];
  if (!chapter) return;
  deleteModal.value = { visible: true, chapterIndex: idx, chapterTitle: chapter.title };
};

const executeDelete = async () => {
  const idx = deleteModal.value.chapterIndex;
  deleteModal.value.visible = false;
  if (!story.value || idx < 0) return;
  try {
    await api.del(`/stories/${story.value.id}/chapters/${idx}`);
    chapters.value.splice(idx, 1);
    showToast("Главу видалено", "success");
  } catch (e) {
    console.error(e);
    showToast("Помилка при видаленні", "error");
  }
};

const stripHtml = (html: string) => {
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent || "";
};
</script>

<style scoped>
.story-page {
  background-color: #f9f9f9;
}

.not-found {
  text-align: center;
  padding: 60px 20px;
  font-size: 1.2rem;
  color: var(--color-text-muted);
}

.story-metadata {
  padding: 40px;
  margin-bottom: 40px;
}

.cover {
  width: 280px;
  height: 400px;
  object-fit: cover;
  border-radius: 12px;
  box-shadow: var(--shadow-sm);
}

.story-info h1 { margin: 0 0 20px; color: var(--color-text); }
.story-info p { margin: 8px 0; color: #555; }

.chapters-section {
  padding: 32px 40px;
}

.chapters-header {
  margin-bottom: 24px;
}

.chapters-header h2 { margin: 0; font-size: 1.4rem; color: var(--color-text); }

.no-chapters {
  color: #999;
  text-align: center;
  padding: 40px 0;
  font-size: 1rem;
}

.chapter-card {
  border: 1px solid #e8e8e8;
  border-radius: var(--radius-md);
  padding: 18px 20px;
  transition: box-shadow 0.2s, border-color 0.2s;
}

.chapter-card:hover {
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.1);
  border-color: var(--color-primary);
}

.chapter-card-main {
  cursor: pointer;
}

.chapter-number {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-primary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.chapter-title { font-size: 1.05rem; font-weight: 600; color: #222; }

.chapter-preview {
  font-size: 0.9rem;
  color: #888;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.story-owner-actions { margin-top: 20px; }

.modal-wide { max-width: 560px; width: 100%; }

.edit-form {
  max-height: 60vh;
  overflow-y: auto;
  padding-right: 4px;
  margin-bottom: 16px;
}

.edit-form-group label { font-size: 13px; font-weight: 600; color: #444; }

.cover-preview {
  width: 80px;
  height: 112px;
  object-fit: cover;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
}

@media (max-width: 768px) {
  .story-metadata { flex-direction: column; padding: 20px; }
  .cover { width: 100%; height: auto; }
  .chapters-section { padding: 20px; }
  .chapter-card-actions { width: 100%; }
}
</style>