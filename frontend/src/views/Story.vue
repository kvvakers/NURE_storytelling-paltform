<template>
  <div v-if="story" class="story-page">
    <div class="_container">
      <!-- Story Metadata -->
      <div class="story-metadata _flex _gap-x-32">
        <div>
          <img :src="story.cover" :alt="story.title" class="cover" />
        </div>
        <div class="story-info">
          <h1 class="_h1">{{ story.title }}</h1>
          <p><b>Автор:</b> {{ story.author }}</p>
          <p><b>Опис:</b> {{ story.description }}</p>
          <p><b>Рейтинг:</b> {{ story.rating }}/10</p>
          <p><b>Дата публікації:</b> {{ new Date(story.createdAt).toLocaleDateString('uk-UA') }}</p>
          <div class="genres">
            <span v-for="g in story.genres" :key="g" class="genre">{{ g }}</span>
          </div>
        </div>
      </div>

      <!-- Chapters list -->
      <div class="chapters-section">
        <div class="chapters-header">
          <h2>Глави ({{ chapters.length }})</h2>
          <button v-if="story.isMine" type="button" class="btn btn-primary" @click="goToAddChapter">
            + Додати главу
          </button>
        </div>

        <div v-if="chapters.length === 0" class="no-chapters">
          Глав ще немає.
        </div>

        <div v-else class="chapter-list">
          <div v-for="(ch, idx) in chapters" :key="idx" class="chapter-card">
            <div class="chapter-card-main" @click="goToRead(idx)">
              <span class="chapter-number">Глава {{ idx + 1 }}</span>
              <span class="chapter-title">{{ ch.title }}</span>
              <span class="chapter-preview">{{ stripHtml(ch.content).slice(0, 120) }}{{ ch.content.length > 120 ? '…' : '' }}</span>
            </div>
            <div v-if="story.isMine" class="chapter-card-actions">
              <button
                type="button"
                class="btn btn-secondary btn-sm"
                @click.stop="editChapter(idx)"
                title="Редагувати"
              >
                ✏ Редагувати
              </button>
              <button
                type="button"
                class="btn btn-danger btn-sm"
                @click.stop="confirmDeleteChapter(idx)"
                title="Видалити"
              >
                🗑 Видалити
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

  <!-- Confirm Delete Modal -->
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
  padding: 40px 0;
  min-height: 100vh;
  background-color: #f9f9f9;
}

.not-found {
  text-align: center;
  padding: 60px 20px;
  font-size: 1.2rem;
  color: #666;
}

/* Metadata */
.story-metadata {
  background: white;
  padding: 40px;
  border-radius: 12px;
  margin-bottom: 40px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.cover {
  width: 280px;
  height: 400px;
  object-fit: cover;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.story-info { flex: 1; }
.story-info h1 { margin: 0 0 20px; color: #333; }
.story-info p { margin: 8px 0; color: #555; }

.genres { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
.genre { padding: 6px 12px; background: #e7f3ff; color: #007bff; border-radius: 20px; font-size: 0.9rem; }

/* Chapters section */
.chapters-section {
  background: white;
  border-radius: 12px;
  padding: 32px 40px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.chapters-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.chapters-header h2 {
  margin: 0;
  font-size: 1.4rem;
  color: #333;
}

.no-chapters {
  color: #999;
  text-align: center;
  padding: 40px 0;
  font-size: 1rem;
}

.chapter-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.chapter-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 1px solid #e8e8e8;
  border-radius: 10px;
  padding: 18px 20px;
  transition: box-shadow 0.2s, border-color 0.2s;
  gap: 16px;
}

.chapter-card:hover {
  box-shadow: 0 4px 14px rgba(0,0,0,0.1);
  border-color: #007bff;
}

.chapter-card-main {
  display: flex;
  flex-direction: column;
  gap: 4px;
  cursor: pointer;
  flex: 1;
  min-width: 0;
}

.chapter-number {
  font-size: 0.8rem;
  font-weight: 600;
  color: #007bff;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.chapter-title {
  font-size: 1.05rem;
  font-weight: 600;
  color: #222;
}

.chapter-preview {
  font-size: 0.9rem;
  color: #888;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chapter-card-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

/* Buttons */
.btn {
  padding: 8px 18px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 0.82rem;
}

.btn-primary { background: #007bff; color: white; }
.btn-primary:hover { background: #0056b3; }

.btn-secondary { background: transparent; color: #333; border: 1px solid #ddd; }
.btn-secondary:hover { background: #f0f0f0; }

.btn-danger { background: transparent; color: #dc3545; border: 1px solid #dc3545; }
.btn-danger:hover { background: #dc3545; color: white; }

@media (max-width: 768px) {
  .story-metadata { flex-direction: column; padding: 20px; }
  .cover { width: 100%; height: auto; }
  .chapters-section { padding: 20px; }
  .chapter-card { flex-direction: column; align-items: flex-start; }
  .chapter-card-actions { width: 100%; justify-content: flex-end; }
}

/* Confirm Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9998;
}

.modal {
  background: white;
  border-radius: 12px;
  padding: 32px 36px;
  min-width: 320px;
  max-width: 440px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.modal-title {
  margin: 0 0 12px;
  font-size: 1.2rem;
  color: #222;
}

.modal-text {
  margin: 0 0 24px;
  color: #555;
  font-size: 0.95rem;
  line-height: 1.5;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>