<template>
  <div v-if="chapter" class="read-page">
    <div class="_container">
      <!-- Header -->
      <div class="read-header">
        <button class="btn btn-secondary back-btn" @click="router.push({ name: RouteName.STORY, params: { id: storyId } })">
          ← Назад до історії
        </button>
        <div class="read-nav">
          <button
            class="btn btn-secondary"
            :disabled="chapterIndex <= 0"
            @click="navigateTo(chapterIndex - 1)"
          >
            ← Попередня
          </button>
          <span class="chapter-counter">Глава {{ chapterIndex + 1 }} / {{ totalChapters }}</span>
          <button
            class="btn btn-secondary"
            :disabled="chapterIndex >= totalChapters - 1"
            @click="navigateTo(chapterIndex + 1)"
          >
            Наступна →
          </button>
        </div>
      </div>

      <!-- Chapter Content -->
      <div class="read-body">
        <h1 class="chapter-title">{{ chapter.title }}</h1>
        <div
          ref="chapterTextRef"
          class="chapter-text"
          @mouseup="handleTextSelection"
          v-html="chapter.content"
        ></div>

        <!-- Comment Tooltip -->
        <div
          v-if="showCommentTooltip"
          class="comment-tooltip"
          :style="tooltipPosition"
        >
          <button @click="openCommentPanel" class="comment-tooltip-btn">
            🗣 Додати коментар
          </button>
        </div>

        <!-- Comment Input Panel -->
        <div v-if="showCommentPanel" class="comment-input-panel">
          <div class="comment-panel-header">
            <h3>Додати коментар</h3>
            <button type="button" @click="closeCommentPanel" class="close-btn">×</button>
          </div>
          <div class="comment-quote-preview">
            <p><strong>Виділений текст:</strong></p>
            <p class="quote">"{{ selectedText }}"</p>
          </div>
          <textarea
            v-model="newCommentText"
            placeholder="Напишіть ваш коментар..."
            class="comment-textarea"
          ></textarea>
          <div class="comment-panel-actions">
            <button @click="submitComment" class="btn btn-primary">Опублікувати</button>
            <button @click="closeCommentPanel" class="btn btn-secondary">Скасувати</button>
          </div>
        </div>
      </div>

      <!-- Comments -->
      <div v-if="comments.length > 0" class="comments-section">
        <h3>Коментарі ({{ comments.length }})</h3>
        <div v-for="(comment, idx) in comments" :key="idx" class="comment-block">
          <div class="comment-quote-section">
            <p class="comment-quote">"{{ comment.selectedText }}"</p>
          </div>
          <div class="comment-content">
            <p class="comment-text">{{ comment.text }}</p>
            <div class="comment-meta">
              <span class="comment-author">{{ comment.authorName || comment.author || ('Читач #' + (comment.authorId ?? '?')) }}</span>
              <span class="comment-date">{{ formatDate(comment.createdAt || comment.date || '') }}</span>
            </div>
          </div>
          <div v-if="comment.replies && comment.replies.length > 0" class="replies">
            <div v-for="(reply, ri) in comment.replies" :key="ri" class="reply">
              <p class="reply-text">{{ reply.text }}</p>
              <div class="reply-meta">
                <span class="reply-author">{{ reply.authorName || reply.author || (reply.authorId ? 'Читач #' + reply.authorId : 'Анонімний') }}</span>
                <span class="reply-date">{{ formatDate(reply.createdAt || reply.date) }}</span>
              </div>
            </div>
          </div>
          <button @click="toggleReply(idx)" class="reply-btn">
            {{ expandedReplyIndex === idx ? 'Сховати' : 'Відповісти' }}
          </button>
          <div v-if="expandedReplyIndex === idx" class="reply-input-section">
            <textarea v-model="replyText" placeholder="Ваша відповідь..." class="reply-textarea"></textarea>
            <div class="reply-actions">
              <button @click="submitReply(idx)" class="btn btn-primary">Надіслати</button>
              <button @click="toggleReply(-1)" class="btn btn-secondary">Скасувати</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom navigation -->
      <div class="read-footer">
        <button
          class="btn btn-secondary"
          :disabled="chapterIndex <= 0"
          @click="navigateTo(chapterIndex - 1)"
        >
          ← Попередня глава
        </button>
        <button
          class="btn btn-primary"
          :disabled="chapterIndex >= totalChapters - 1"
          @click="navigateTo(chapterIndex + 1)"
        >
          Наступна глава →
        </button>
      </div>
    </div>
  </div>

  <div v-else class="loading">
    <p>Завантаження...</p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useUserStore } from "../stores/user";
import { useToast } from "../composables/useToast";
import { RouteName } from "../router/keys";

interface Reply {
  id?: string;
  text: string;
  authorId?: number;
  authorName?: string;
  author?: string;
  createdAt?: string;
  date?: string;
}

interface Comment {
  id: string;
  selectedText: string;
  text: string;
  authorId?: number;
  authorName?: string;
  author?: string;
  createdAt?: string;
  date?: string;
  replies?: Reply[];
}

interface Chapter {
  title: string;
  content: string;
}

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const { show: showToast } = useToast();

const storyId = computed(() => Number(route.params.id));
const chapterIndex = computed(() => Number(route.params.chapterIndex));
const totalChapters = ref(0);
const chapter = ref<Chapter | null>(null);

const comments = ref<Comment[]>([]);
const selectedText = ref("");
const showCommentTooltip = ref(false);
const showCommentPanel = ref(false);
const newCommentText = ref("");
const tooltipPosition = ref({ top: "0px", left: "0px" });
const expandedReplyIndex = ref(-1);
const replyText = ref("");
const chapterTextRef = ref<HTMLElement | null>(null);

const API_BASE = "http://localhost:3000";

const loadChapter = async () => {
  chapter.value = null;
  try {
    const headers: Record<string, string> = {};
    if (userStore.isAuthorized && userStore.token) {
      headers.Authorization = `Bearer ${userStore.token}`;
    }
    const res = await fetch(`${API_BASE}/stories/${storyId.value}`, { headers });
    if (!res.ok) return;
    const data = await res.json();
    totalChapters.value = (data.chapters || []).length;
    chapter.value = data.chapters?.[chapterIndex.value] ?? null;
    expandedReplyIndex.value = -1;
    // load persisted comments from backend
    await loadComments();
  } catch (e) {
    console.error(e);
  }
};

onMounted(loadChapter);
watch([() => route.params.id, () => route.params.chapterIndex], loadChapter);

const navigateTo = (idx: number) => {
  router.push({ name: RouteName.READ_CHAPTER, params: { id: storyId.value, chapterIndex: idx } });
};

const loadComments = async () => {
  try {
    const res = await fetch(`${API_BASE}/stories/${storyId.value}/chapters/${chapterIndex.value}/comments`);
    if (res.ok) {
      const data = await res.json();
      comments.value = Array.isArray(data) ? data : [];
    }
  } catch (e) {
    console.error(e);
  }
};

const handleTextSelection = () => {
  const selection = window.getSelection();
  if (selection && selection.toString().length > 0) {
    selectedText.value = selection.toString();
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const containerRect = chapterTextRef.value?.getBoundingClientRect();
    if (containerRect) {
      tooltipPosition.value = {
        top: `${rect.bottom - containerRect.top + 10}px`,
        left: `${rect.left - containerRect.left + rect.width / 2 - 60}px`,
      };
    }
    showCommentTooltip.value = true;
  } else {
    showCommentTooltip.value = false;
  }
};

const openCommentPanel = () => {
  showCommentPanel.value = true;
  showCommentTooltip.value = false;
};

const closeCommentPanel = () => {
  showCommentPanel.value = false;
  newCommentText.value = "";
  selectedText.value = "";
};

const submitComment = async () => {
  if (!selectedText.value.trim() || !newCommentText.value.trim()) {
    showToast("Виділіть текст і введіть коментар", "warning");
    return;
  }
  if (!userStore.isAuthorized || !userStore.token) {
    showToast("Для коментарів потрібна авторизація", "warning");
    return;
  }
  try {
    const res = await fetch(
      `${API_BASE}/stories/${storyId.value}/chapters/${chapterIndex.value}/comments`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userStore.token}`,
        },
        body: JSON.stringify({ selectedText: selectedText.value, text: newCommentText.value }),
      },
    );
    if (!res.ok) throw new Error("Failed");
    await loadComments();
    closeCommentPanel();
    showToast("Коментар додано!", "success");
  } catch (e) {
    console.error(e);
    showToast("Помилка при додаванні коментаря", "error");
  }
};

const toggleReply = (idx: number) => {
  expandedReplyIndex.value = expandedReplyIndex.value === idx ? -1 : idx;
  replyText.value = "";
};

const submitReply = async (commentIndex: number) => {
  if (!replyText.value.trim()) {
    showToast("Напишіть відповідь", "warning");
    return;
  }
  const comment = comments.value[commentIndex];
  if (!comment) return;
  if (!userStore.isAuthorized || !userStore.token) {
    showToast("Необхідно увійти в систему", "error");
    return;
  }
  try {
    const res = await fetch(
      `http://localhost:3000/stories/${storyId.value}/chapters/${chapterIndex.value}/comments/${comment.id}/replies`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userStore.token}`,
        },
        body: JSON.stringify({ text: replyText.value }),
      }
    );
    if (!res.ok) throw new Error("Помилка при збереженні відповіді");
    toggleReply(-1);
    await loadComments();
    showToast("Відповідь додано!", "success");
  } catch {
    showToast("Не вдалося зберегти відповідь", "error");
  }
};

const formatDate = (date: string | Date | undefined) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString("uk-UA", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};
</script>

<style scoped>
.read-page {
  padding: 40px 0;
  min-height: 100vh;
  background: #f9f9f9;
}

.loading {
  text-align: center;
  padding: 80px 20px;
  color: #999;
  font-size: 1.1rem;
}

.read-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 32px;
  flex-wrap: wrap;
  gap: 12px;
}

.read-nav {
  display: flex;
  align-items: center;
  gap: 16px;
}

.chapter-counter {
  color: #666;
  font-size: 0.95rem;
  white-space: nowrap;
}

.back-btn {
  font-size: 0.9rem;
}

.read-body {
  background: white;
  border-radius: 12px;
  padding: 48px 56px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  margin-bottom: 32px;
  position: relative;
}

.chapter-title {
  font-size: 2rem;
  color: #222;
  margin: 0 0 36px;
  font-weight: 700;
}

.chapter-text {
  font-size: 1.05rem;
  line-height: 1.95;
  color: #333;
  user-select: text;
}

.chapter-text :deep(p) {
  margin-bottom: 20px;
  text-align: justify;
}

/* Comment Tooltip */
.comment-tooltip {
  position: absolute;
  background: white;
  border: 2px solid #007bff;
  border-radius: 8px;
  padding: 8px;
  box-shadow: 0 4px 12px rgba(0,123,255,0.2);
  z-index: 100;
}
.comment-tooltip-btn {
  background: #007bff;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
}
.comment-tooltip-btn:hover { background: #0056b3; }

/* Comment Input Panel */
.comment-input-panel {
  background: #f8f9fa;
  border: 2px solid #007bff;
  border-radius: 12px;
  padding: 20px;
  margin-top: 24px;
}
.comment-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.comment-panel-header h3 { margin: 0; color: #333; }
.close-btn { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #999; }
.close-btn:hover { color: #333; }
.comment-quote-preview { background: white; padding: 12px; border-radius: 8px; margin-bottom: 16px; }
.comment-quote-preview p:first-child { margin: 0 0 8px; font-weight: 600; font-size: 0.9rem; color: #555; }
.quote { margin: 0; font-style: italic; color: #007bff; }
.comment-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  font-family: inherit;
  resize: vertical;
  min-height: 90px;
  margin-bottom: 12px;
  box-sizing: border-box;
}
.comment-textarea:focus { outline: none; border-color: #007bff; box-shadow: 0 0 0 3px rgba(0,123,255,0.1); }
.comment-panel-actions { display: flex; gap: 12px; }

/* Comments section */
.comments-section {
  background: white;
  border-radius: 12px;
  padding: 32px 40px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  margin-bottom: 32px;
}
.comments-section h3 { margin: 0 0 24px; color: #333; }
.comment-block {
  background: #f8f9fa;
  border-left: 4px solid #007bff;
  padding: 16px;
  margin-bottom: 20px;
  border-radius: 8px;
}
.comment-quote-section { background: white; padding: 12px; border-radius: 6px; margin-bottom: 12px; }
.comment-quote { margin: 0; font-style: italic; color: #007bff; font-weight: 500; }
.comment-content { margin-bottom: 12px; }
.comment-text { margin: 0 0 8px; color: #333; line-height: 1.6; }
.comment-meta { display: flex; gap: 12px; font-size: 0.85rem; color: #999; }
.comment-author { font-weight: 600; color: #666; }
.reply-btn {
  background: #007bff;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
}
.reply-btn:hover { background: #0056b3; }
.replies { margin-top: 12px; padding-left: 20px; border-left: 2px solid #ddd; }
.reply { background: white; padding: 12px; border-radius: 6px; margin-bottom: 8px; }
.reply-text { margin: 0 0 6px; color: #333; }
.reply-meta { display: flex; gap: 12px; font-size: 0.85rem; color: #999; }
.reply-author { font-weight: 600; color: #666; }
.reply-input-section { margin-top: 12px; padding: 12px; background: white; border-radius: 6px; }
.reply-textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.95rem;
  font-family: inherit;
  resize: vertical;
  min-height: 60px;
  margin-bottom: 8px;
  box-sizing: border-box;
}
.reply-textarea:focus { outline: none; border-color: #007bff; box-shadow: 0 0 0 3px rgba(0,123,255,0.1); }
.reply-actions { display: flex; gap: 8px; }

/* Footer nav */
.read-footer {
  display: flex;
  justify-content: space-between;
  padding-bottom: 40px;
}

.btn { padding: 8px 20px; border: none; border-radius: 6px; cursor: pointer; font-size: 0.95rem; transition: all 0.2s; }
.btn:disabled { opacity: 0.4; cursor: not-allowed; }
.btn-primary { background: #007bff; color: white; }
.btn-primary:not(:disabled):hover { background: #0056b3; }
.btn-secondary { background: transparent; color: #333; border: 1px solid #ddd; }
.btn-secondary:not(:disabled):hover { background: #f0f0f0; }
</style>
