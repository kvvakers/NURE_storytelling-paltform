<template>
  <div v-if="chapter" class="read-page _page">
    <div class="_container">
      <!-- Header -->
      <div class="read-header _flex _ai-c _jc-sb _flex-wrap _gap-12">
        <div class="_flex _ai-c _gap-12">
          <button class="btn btn-secondary back-btn _flex _ai-c _gap-6" @click="router.push({ name: RouteName.STORY, params: { id: storyId } })">
            <ArrowLeft :size="16" />Назад до історії
          </button>
          <button class="btn btn-secondary reading-timer-header _flex _ai-c _gap-6" title="Час читання цієї глави" tabindex="-1">
            <Timer :size="16" />{{ formattedTime }}
          </button>
        </div>
        <div class="read-nav _flex _ai-c _gap-16">
          <button
            class="btn btn-secondary _flex _ai-c _gap-6"
            :disabled="chapterIndex <= 0"
            @click="navigateTo(chapterIndex - 1)"
          >
            <ChevronLeft :size="16" />Попередня
          </button>
          <span class="chapter-counter">Глава {{ chapterIndex + 1 }} / {{ totalChapters }}</span>
          <button
            class="btn btn-secondary _flex _ai-c _gap-6"
            :disabled="chapterIndex >= totalChapters - 1"
            @click="navigateTo(chapterIndex + 1)"
          >
            Наступна<ChevronRight :size="16" />
          </button>
          <button
            v-if="userStore.isAuthorized && !isMine"
            class="btn _flex _ai-c _gap-6"
            :class="isBookmarked ? 'btn-bookmarked' : 'btn-secondary'"
            :title="isBookmarked ? 'Закладка встановлена' : 'Поставити закладку'"
            @click="toggleBookmark"
          >
            <BookmarkCheck v-if="isBookmarked" :size="16" />
            <Bookmark v-else :size="16" />
          </button>
        </div>
      </div>

      <!-- Chapter Content -->

      <div class="read-body panel">
        <h1 class="chapter-title _h2">{{ chapter.title }}</h1>
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
          <button @click="openCommentPanel" class="btn btn-primary _flex _ai-c _gap-6">
            <MessageSquare :size="15" />Додати коментар</button>
        </div>

        <!-- Comment Input Panel -->
        <div v-if="showCommentPanel" class="comment-input-panel" :style="commentPanelPosition">
          <div class="comment-panel-header _flex _ai-c _jc-sb">
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
            class="form-input form-textarea comment-textarea"
          ></textarea>
          <div class="comment-panel-actions _flex _gap-12">
            <button @click="submitComment" class="btn btn-primary">Опублікувати</button>
            <button @click="closeCommentPanel" class="btn btn-secondary">Скасувати</button>
          </div>
        </div>
      </div>

      <!-- General Comment Form -->
      <div class="general-comment-form panel">
        <h3>Залишити коментар</h3>
        <textarea
          v-model="generalCommentText"
          placeholder="Напишіть ваш коментар до глави..."
          class="form-input form-textarea comment-textarea"
          rows="4"
        ></textarea>
        <div class="general-comment-actions _flex _gap-12">
          <button @click="submitGeneralComment" class="btn btn-primary">Опублікувати</button>
        </div>
      </div>

      <!-- Comments -->
      <div v-if="comments.length > 0" class="comments-section panel">
        <h3>Коментарі ({{ comments.length }})</h3>
        <div v-for="(comment, idx) in comments" :key="idx" class="comment-block">
          <div v-if="comment.selectedText" class="comment-quote-section">
            <p class="comment-quote">"{{ comment.selectedText }}"</p>
          </div>
          <div class="comment-content">
            <p class="comment-text">{{ comment.text }}</p>
            <div class="comment-meta _flex _gap-12">
              <span class="comment-author">{{ comment.authorName || comment.author || ('Читач #' + (comment.authorId ?? '?')) }}</span>
              <span class="comment-date">{{ formatDate(comment.createdAt || comment.date || '') }}</span>
            </div>
          </div>
          <div v-if="comment.replies && comment.replies.length > 0" class="replies">
            <div v-for="(reply, ri) in comment.replies" :key="ri" class="reply">
              <p class="reply-text">{{ reply.text }}</p>
              <div class="reply-meta _flex _gap-12">
                <span class="reply-author">{{ reply.authorName || reply.author || (reply.authorId ? 'Читач #' + reply.authorId : 'Анонімний') }}</span>
                <span class="reply-date">{{ formatDate(reply.createdAt || reply.date) }}</span>
              </div>
            </div>
          </div>
          <button @click="toggleReply(idx)" class="btn btn-primary btn-sm">
            {{ expandedReplyIndex === idx ? 'Сховати' : 'Відповісти' }}
          </button>
          <div v-if="expandedReplyIndex === idx" class="reply-input-section">
            <textarea v-model="replyText" placeholder="Ваша відповідь..." class="form-input form-textarea reply-textarea"></textarea>
            <div class="reply-actions _flex _gap-8">
              <button @click="submitReply(idx)" class="btn btn-primary">Надіслати</button>
              <button @click="toggleReply(-1)" class="btn btn-secondary">Скасувати</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom navigation -->
      <div class="read-footer _flex _jc-sb">
        <button
          class="btn btn-secondary _flex _ai-c _gap-6"
          :disabled="chapterIndex <= 0"
          @click="navigateTo(chapterIndex - 1)"
        >
          <ChevronLeft :size="16" />Попередня глава
        </button>
        <button
          class="btn btn-primary _flex _ai-c _gap-6"
          :disabled="chapterIndex >= totalChapters - 1"
          @click="navigateTo(chapterIndex + 1)"
        >
          Наступна глава<ChevronRight :size="16" />
        </button>
      </div>
    </div>
  </div>

  <button v-if="showFloatingTimer" class="reading-timer-float btn btn-secondary _flex _ai-c _gap-6" tabindex="-1">
    <Timer :size="16" />{{ formattedTime }}
  </button>

  <div v-if="!chapter" class="empty-state">
    <p>Завантаження...</p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useUserStore } from "../stores/user";
import { useToast } from "../composables/useToast";
import { RouteName } from "../router/keys";
import { api } from '../utils/api';
import { ArrowLeft, Bookmark, BookmarkCheck, ChevronLeft, ChevronRight, MessageSquare, Timer } from "lucide-vue-next";

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
const isMine = ref(false);
const bookmarkChapterIndex = ref<number | null>(null);
const isBookmarked = computed(() => bookmarkChapterIndex.value === chapterIndex.value);

const comments = ref<Comment[]>([]);
const selectedText = ref("");
const showCommentTooltip = ref(false);
const showCommentPanel = ref(false);
const newCommentText = ref("");
const tooltipPosition = ref({ top: "0px", left: "0px" });
const commentPanelPosition = ref({ top: "0px", left: "0px" });
const selectionRect = ref<DOMRect | null>(null);
const expandedReplyIndex = ref(-1);
const replyText = ref("");
const generalCommentText = ref("");
const chapterTextRef = ref<HTMLElement | null>(null);

let readingStartTime: number | null = null;
let hiddenSince: number | null = null;
let trackedStoryId: number | null = null;
let trackedChapterIndex: number | null = null;

const elapsedSeconds = ref(0);
let timerInterval: ReturnType<typeof setInterval> | null = null;

const startTimer = () => {
  elapsedSeconds.value = 0;
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => { elapsedSeconds.value++; }, 1000);
};

const resumeTimer = () => {
  if (timerInterval) return;
  timerInterval = setInterval(() => { elapsedSeconds.value++; }, 1000);
};

const stopTimer = () => {
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
};

const formattedTime = computed(() => {
  const m = Math.floor(elapsedSeconds.value / 60);
  const s = elapsedSeconds.value % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
});

const flushReadingSession = (useBeacon = false) => {
  if (readingStartTime == null || trackedStoryId == null || trackedChapterIndex == null) return;
  const durationSeconds = Math.floor((Date.now() - readingStartTime) / 1000);
  stopTimer();
  readingStartTime = null;
  if (durationSeconds < 5) return;
  const payload = { storyId: trackedStoryId, chapterIndex: trackedChapterIndex, durationSeconds };
  if (useBeacon && navigator.sendBeacon) {
    navigator.sendBeacon(
      (import.meta.env.VITE_API_URL ?? '') + `/statistics/reading-session`,
      new Blob([JSON.stringify(payload)], { type: 'application/json' }),
    );
  } else {
    void api.post('/statistics/reading-session', payload);
  }
};

const loadChapter = async () => {
  flushReadingSession();
  chapter.value = null;
  try {
    const data = await api.get(`/stories/${storyId.value}`);
    totalChapters.value = (data.chapters || []).length;
    chapter.value = data.chapters?.[chapterIndex.value] ?? null;
    expandedReplyIndex.value = -1;
    isMine.value = !!data.isMine;
    trackedStoryId = storyId.value;
    trackedChapterIndex = chapterIndex.value;
    readingStartTime = Date.now();
    startTimer();
    if (userStore.isAuthorized && !data.isMine) {
      try {
        const status = await api.get(`/library/check/${storyId.value}`);
        bookmarkChapterIndex.value = status.bookmarkChapterIndex ?? null;
      } catch { /* ignore */ }
    } else {
      bookmarkChapterIndex.value = null;
    }
    await loadComments();
  } catch (e) {
    console.error(e);
  }
};

const toggleBookmark = async () => {
  if (!userStore.isAuthorized || isMine.value) return;
  try {
    const res = await api.patch(`/library/${storyId.value}/bookmark`, { chapterIndex: chapterIndex.value });
    bookmarkChapterIndex.value = res.bookmarkChapterIndex ?? null;
    showToast(bookmarkChapterIndex.value === chapterIndex.value ? 'Закладку встановлено' : 'Закладку знято', 'success');
  } catch {
    showToast('Помилка при встановленні закладки', 'error');
  }
};

const showFloatingTimer = ref(false);
const onScroll = () => { showFloatingTimer.value = window.scrollY > 120; };

const onVisibilityChange = () => {
  if (document.hidden) {
    hiddenSince = Date.now();
    stopTimer();
  } else {
    if (hiddenSince !== null && readingStartTime !== null) {
      readingStartTime += Date.now() - hiddenSince;
    }
    hiddenSince = null;
    if (readingStartTime !== null) resumeTimer();
  }
};

const onBeforeUnload = () => flushReadingSession(true);

onMounted(() => {
  loadChapter();
  window.addEventListener('beforeunload', onBeforeUnload);
  window.addEventListener('scroll', onScroll, { passive: true });
  document.addEventListener('visibilitychange', onVisibilityChange);
});

onUnmounted(() => {
  flushReadingSession();
  stopTimer();
  window.removeEventListener('beforeunload', onBeforeUnload);
  window.removeEventListener('scroll', onScroll);
  document.removeEventListener('visibilitychange', onVisibilityChange);
});

watch([() => route.params.id, () => route.params.chapterIndex], loadChapter);

const navigateTo = (idx: number) => {
  router.push({ name: RouteName.READ_CHAPTER, params: { id: storyId.value, chapterIndex: idx } });
};

const loadComments = async () => {
  try {
    const data = await api.get(`/stories/${storyId.value}/chapters/${chapterIndex.value}/comments`);
    comments.value = Array.isArray(data) ? data : [];
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
    selectionRect.value = rect;
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

const COMMENT_PANEL_HEIGHT = 290;
const COMMENT_PANEL_WIDTH = 320;

const openCommentPanel = () => {
  const rect = selectionRect.value;
  if (rect) {
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const rawLeft = rect.left + rect.width / 2 - COMMENT_PANEL_WIDTH / 2;
    const left = Math.min(window.innerWidth - COMMENT_PANEL_WIDTH - 8, Math.max(8, rawLeft));
    const top = spaceBelow >= spaceAbove
      ? rect.bottom + 10
      : rect.top - COMMENT_PANEL_HEIGHT - 40;
    commentPanelPosition.value = { top: `${top}px`, left: `${left}px` };
  }
  showCommentPanel.value = true;
  showCommentTooltip.value = false;
};

const closeCommentPanel = () => {
  showCommentPanel.value = false;
  newCommentText.value = "";
  selectedText.value = "";
};

const submitGeneralComment = async () => {
  if (!generalCommentText.value.trim()) {
    showToast("Введіть текст коментаря", "warning");
    return;
  }
  if (!userStore.isAuthorized || !userStore.token) {
    showToast("Для коментарів потрібна авторизація", "warning");
    return;
  }
  try {
    await api.post(`/stories/${storyId.value}/chapters/${chapterIndex.value}/comments`, { selectedText: "", text: generalCommentText.value });
    generalCommentText.value = "";
    await loadComments();
    showToast("Коментар додано!", "success");
  } catch (e) {
    console.error(e);
    showToast("Помилка при додаванні коментаря", "error");
  }
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
    await api.post(`/stories/${storyId.value}/chapters/${chapterIndex.value}/comments`, { selectedText: selectedText.value, text: newCommentText.value });
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
    await api.post(`/stories/${storyId.value}/chapters/${chapterIndex.value}/comments/${comment.id}/replies`, { text: replyText.value });
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
  background: #f9f9f9;
}

.read-header {
  margin-bottom: 32px;
}

.chapter-counter {
  color: var(--color-text-muted);
  font-size: 0.95rem;
  white-space: nowrap;
}

.reading-timer-header {
  font-variant-numeric: tabular-nums;
  font-size: 0.9rem;
  cursor: default;
}

.reading-timer-float {
  position: fixed;
  bottom: 32px;
  right: 32px;
  font-variant-numeric: tabular-nums;
  font-size: 0.95rem;
  z-index: 200;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  cursor: default;
  opacity: 1;
  background: white;
}

.back-btn {
  font-size: 0.9rem;
}

.read-body {
  padding: 48px 56px;
  margin-bottom: 32px;
  position: relative;
}

.chapter-title {
  color: #222;
  margin: 0 0 36px;
  font-weight: 700;
}

.chapter-text {
  font-size: 1.05rem;
  line-height: 1.95;
  color: var(--color-text);
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
  border: 2px solid var(--color-primary);
  border-radius: 8px;
  padding: 8px;
  box-shadow: 0 4px 12px rgba(0, 123, 255, 0.2);
  z-index: 100;
}

/* Comment Input Panel */
.comment-input-panel {
  position: fixed;
  background: white;
  border: 2px solid var(--color-primary);
  border-radius: 12px;
  padding: 20px;
  width: 320px;
  box-shadow: 0 8px 24px rgba(0, 123, 255, 0.15);
  z-index: 1000;
}
.comment-panel-header { margin-bottom: 16px; }
.comment-panel-header h3 { margin: 0; color: var(--color-text); }
.close-btn { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #999; }
.close-btn:hover { color: var(--color-text); }
.comment-quote-preview { background: white; padding: 12px; border-radius: 8px; margin-bottom: 16px; }
.comment-quote-preview p:first-child { margin: 0 0 8px; font-weight: 600; font-size: 0.9rem; color: #555; }
.quote { margin: 0; font-style: italic; color: var(--color-primary); }
.comment-textarea {
  min-height: 90px;
  margin-bottom: 12px;
}
/* General Comment Form */
.general-comment-form {
  padding: 32px 40px;
  margin-bottom: 32px;
}
.general-comment-form h3 {
  margin: 0 0 16px;
  color: var(--color-text);
}
.general-comment-actions {
  margin-top: 12px;
}

/* Comments section */
.comments-section {
  padding: 32px 40px;
  margin-bottom: 32px;
}
.comments-section h3 { margin: 0 0 24px; color: var(--color-text); }
.comment-block {
  background: #f8f9fa;
  border-left: 4px solid var(--color-primary);
  padding: 16px;
  margin-bottom: 20px;
  border-radius: 8px;
}
.comment-quote-section { background: white; padding: 12px; border-radius: var(--radius-sm); margin-bottom: 12px; }
.comment-quote { margin: 0; font-style: italic; color: var(--color-primary); font-weight: 500; }
.comment-content { margin-bottom: 12px; }
.comment-text { margin: 0 0 8px; color: var(--color-text); line-height: 1.6; }
.comment-meta { font-size: 0.85rem; color: #999; }
.comment-author { font-weight: 600; color: var(--color-text-muted); }
.replies { margin-top: 12px; padding-left: 20px; border-left: 2px solid var(--color-border); }
.reply { background: white; padding: 12px; border-radius: var(--radius-sm); margin-bottom: 8px; }
.reply-text { margin: 0 0 6px; color: var(--color-text); }
.reply-meta { font-size: 0.85rem; color: #999; }
.reply-author { font-weight: 600; color: var(--color-text-muted); }
.reply-input-section { margin-top: 12px; padding: 12px; background: white; border-radius: var(--radius-sm); }
.reply-textarea {
  min-height: 60px;
  margin-bottom: 8px;
}
/* Footer nav */
.read-footer {
  padding-bottom: 40px;
}

.btn-bookmarked {
  background-color: #fef9c3;
  color: #854d0e;
  border: 1px solid #fde68a;
}

.btn-bookmarked:hover {
  background-color: #fef08a;
}

@media (max-width: 768px) {
  .read-header {
    gap: 8px;
    margin-bottom: 16px;
  }
  .read-nav {
    flex-wrap: wrap;
    gap: 8px;
    justify-content: center;
    width: 100%;
  }
  .read-body {
    padding: 24px 20px;
  }
  .general-comment-form {
    padding: 20px;
  }
  .comments-section {
    padding: 20px;
  }
  .read-footer {
    flex-wrap: wrap;
    gap: 12px;
  }
  .read-footer .btn {
    flex: 1;
    justify-content: center;
  }
  .reading-timer-float {
    bottom: 16px;
    right: 16px;
  }
}
</style>
