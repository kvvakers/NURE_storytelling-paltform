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
          <p><b>Описание:</b> {{ story.description }}</p>
          <p><b>Рейтинг:</b> {{ story.rating }}/10</p>
          <p><b>Дата публикации:</b> {{ new Date(story.created_at).toLocaleDateString() }}</p>

          <div class="genres">
            <span v-for="g in story.genres" :key="g" class="genre">
              {{ g }}
            </span>
          </div>
        </div>
      </div>

      <!-- Chapter Reading -->
      <div class="chapter-section">
        <div class="chapter-tabs">
          <button
            v-for="(ch, idx) in chapters"
            :key="idx"
            @click="activeChapterIndex = idx"
            class="chapter-tab"
            :class="{ active: activeChapterIndex === idx }"
          >
            {{ ch.title }}
          </button>
        </div>

        <div class="chapter-content">
          <h2>{{ activeChapter.title }}</h2>
          
          <!-- Chapter Text with Comment Support -->
          <div class="text-content">
            <div
              ref="chapterTextRef"
              @mouseup="handleTextSelection"
              class="chapter-text"
              v-html="activeChapter.content"
            ></div>

            <!-- Comment Tooltip -->
            <div
              v-if="showCommentTooltip"
              class="comment-tooltip"
              :style="tooltipPosition"
            >
              <button @click="openCommentInput" class="comment-tooltip-btn">
                💬 Добавить комментарий
              </button>
            </div>

            <!-- Comment Input Panel -->
            <div v-if="showCommentPanel" class="comment-input-panel">
              <div class="comment-panel-header">
                <h3>Добавить комментарий</h3>
                <button type="button" @click="closeCommentPanel" class="close-btn">×</button>
              </div>
              
              <div class="comment-quote-preview">
                <p><strong>Выделенный текст:</strong></p>
                <p class="quote">"{{ selectedText }}"</p>
              </div>

              <textarea
                v-model="newCommentText"
                placeholder="Напишите ваш комментарий..."
                class="comment-textarea"
              ></textarea>

              <div class="comment-panel-actions">
                <button @click="submitComment" class="btn btn-primary">
                  Опубликовать комментарий
                </button>
                <button @click="closeCommentPanel" class="btn btn-secondary">
                  Отмена
                </button>
              </div>
            </div>
          </div>

          <!-- Comments Display -->
          <div v-if="activeChapterComments.length > 0" class="comments-display">
            <h3>Комментарии читателей ({{ activeChapterComments.length }})</h3>

            <div v-for="(comment, idx) in activeChapterComments" :key="idx" class="comment-block">
              <div class="comment-quote-section">
                <p class="comment-quote">"{{ comment.selectedText }}"</p>
              </div>

              <div class="comment-content">
                <p class="comment-text">{{ comment.text }}</p>
                <div class="comment-meta">
                  <span class="comment-author">{{ comment.author || 'Анонимный' }}</span>
                  <span class="comment-date">{{ formatDate(comment.date) }}</span>
                </div>
              </div>

              <div v-if="comment.replies && comment.replies.length > 0" class="replies">
                <div v-for="(reply, replyIdx) in comment.replies" :key="replyIdx" class="reply">
                  <p class="reply-text">{{ reply.text }}</p>
                  <div class="reply-meta">
                    <span class="reply-author">{{ reply.author || 'Анонимный' }}</span>
                    <span class="reply-date">{{ formatDate(reply.date) }}</span>
                  </div>
                </div>
              </div>

              <button @click="toggleReplyForm(idx)" class="reply-btn">
                {{ expandedReplyIndex === idx ? 'Скрыть ответ' : 'Ответить' }}
              </button>

              <div v-if="expandedReplyIndex === idx" class="reply-input-section">
                <textarea
                  v-model="replyText"
                  placeholder="Напишите ответ..."
                  class="reply-textarea"
                ></textarea>
                <div class="reply-actions">
                  <button @click="submitReply(idx)" class="btn btn-primary">
                    Отправить ответ
                  </button>
                  <button @click="toggleReplyForm(-1)" class="btn btn-secondary">
                    Отмена
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div v-else class="not-found">
    <p>История не найдена</p>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from "vue-router";
import { data as stories } from "../mock/stories";
import { computed, ref, onMounted } from "vue";

interface Comment {
  selectedText: string;
  text: string;
  author?: string;
  date: Date;
  replies?: Reply[];
}

interface Reply {
  text: string;
  author?: string;
  date: Date;
}

interface Chapter {
  title: string;
  content: string;
}

const route = useRoute();

const story = computed(() => {
  const id = Number(route.params.id);
  return stories.find((s) => s.id === id);
});

// Sample chapters - in production this would come from backend
const chapters = ref<Chapter[]>([
  {
    title: "Глава 1: Начало",
    content: `<p>Это была холодная ночь декабря, когда всё началось. Луна висела над городом, как бледный шар, освещая улицы тусклым светом. Главный герой шёл по тротуару, глубоко погрузившись в мысли о прошлом.</p>
    <p>Каждый шаг отзывался в тишине города. Вокруг не было ни единого человека, только редкие машины проезжали время от времени. Он поднял воротник пальто выше, защищаясь от холодова ветра.</p>
    <p>Сегодня был особенный день. День, который изменит всё. День, который он ждал так долго. Но теперь, когда момент наступил, он чувствовал только страх и неуверенность.</p>`
  },
  {
    title: "Глава 2: Встреча",
    content: `<p>Впереди, под фонарём, он увидел силуэт. Это была женщина. Она стояла неподвижно, ожидая. Её волосы развевались на ветру, и даже издалека было видно, что она красива.</p>
    <p>Сердце главного героя заколотилось быстрее. Он остановился, не зная, идти ли дальше. Но ноги сами несли его вперёд, как будто по собственной воле.</p>
    <p>"Ты пришёл", - сказала она, когда он подошёл ближе. Голос её был мягким, почти шёпотом. "Я ждала тебя так долго..."</p>`
  }
]);

const activeChapterIndex = ref(0);

const activeChapter = computed(() => chapters.value[activeChapterIndex.value]);

const activeChapterComments = computed(() => {
  return chapterComments.value[activeChapterIndex.value] || [];
});

// Comments state
const chapterComments = ref<Comment[][]>(
  Array(chapters.value.length).fill([])
);

const selectedText = ref("");
const showCommentTooltip = ref(false);
const showCommentPanel = ref(false);
const newCommentText = ref("");
const tooltipPosition = ref({ top: "0px", left: "0px" });

const expandedReplyIndex = ref(-1);
const replyText = ref("");

const chapterTextRef = ref<HTMLElement | null>(null);

const handleTextSelection = () => {
  const selection = window.getSelection();
  
  if (selection && selection.toString().length > 0) {
    selectedText.value = selection.toString();
    
    // Get position for tooltip
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const containerRect = chapterTextRef.value?.getBoundingClientRect();
    
    if (containerRect) {
      tooltipPosition.value = {
        top: `${rect.bottom - containerRect.top + 10}px`,
        left: `${rect.left - containerRect.left + rect.width / 2 - 50}px`
      };
    }
    
    showCommentTooltip.value = true;
  } else {
    showCommentTooltip.value = false;
  }
};

const openCommentInput = () => {
  showCommentPanel.value = true;
  showCommentTooltip.value = false;
};

const closeCommentPanel = () => {
  showCommentPanel.value = false;
  newCommentText.value = "";
  selectedText.value = "";
};

const submitComment = () => {
  if (!selectedText.value.trim() || !newCommentText.value.trim()) {
    alert("Пожалуйста, выделите текст и введите комментарий");
    return;
  }

  const newComment: Comment = {
    selectedText: selectedText.value,
    text: newCommentText.value,
    author: "Читатель",
    date: new Date(),
    replies: []
  };

  chapterComments.value[activeChapterIndex.value].push(newComment);
  closeCommentPanel();
  alert("Комментарий успешно добавлен!");
};

const toggleReplyForm = (index: number) => {
  expandedReplyIndex.value = expandedReplyIndex.value === index ? -1 : index;
  replyText.value = "";
};

const submitReply = (commentIndex: number) => {
  if (!replyText.value.trim()) {
    alert("Пожалуйста, напишите ответ");
    return;
  }

  const reply: Reply = {
    text: replyText.value,
    author: "Читатель",
    date: new Date()
  };

  if (!chapterComments.value[activeChapterIndex.value][commentIndex].replies) {
    chapterComments.value[activeChapterIndex.value][commentIndex].replies = [];
  }

  chapterComments.value[activeChapterIndex.value][commentIndex].replies!.push(reply);
  toggleReplyForm(-1);
  alert("Ответ успешно добавлен!");
};

const formatDate = (date: Date) => {
  return new Date(date).toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
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

/* Story Metadata */
.story-metadata {
  background: white;
  padding: 40px;
  border-radius: 12px;
  margin-bottom: 40px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.cover {
  width: 280px;
  height: 400px;
  object-fit: cover;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.story-info {
  flex: 1;
}

.story-info h1 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #333;
}

.story-info p {
  margin: 8px 0;
  color: #555;
}

.genres {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
}

.genre {
  padding: 6px 12px;
  background: #e7f3ff;
  color: #007bff;
  border-radius: 20px;
  font-size: 0.9rem;
}

/* Chapter Section */
.chapter-section {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.chapter-tabs {
  display: flex;
  gap: 0;
  background-color: #f8f9fa;
  border-bottom: 2px solid #e0e0e0;
  overflow-x: auto;
}

.chapter-tab {
  flex: 1;
  padding: 16px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  color: #666;
  transition: all 0.3s ease;
  white-space: nowrap;
  border-bottom: 3px solid transparent;
}

.chapter-tab:hover {
  background-color: #e9ecef;
  color: #333;
}

.chapter-tab.active {
  background-color: white;
  color: #007bff;
  border-bottom-color: #007bff;
  font-weight: 600;
}

.chapter-content {
  padding: 40px;
}

.chapter-content h2 {
  color: #333;
  margin-top: 0;
  margin-bottom: 30px;
  font-size: 1.8rem;
}

.text-content {
  position: relative;
  margin-bottom: 40px;
}

.chapter-text {
  font-size: 1.05rem;
  line-height: 1.9;
  color: #333;
  user-select: text;
}

.chapter-text p {
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
  box-shadow: 0 4px 12px rgba(0, 123, 255, 0.2);
  z-index: 100;
}

.comment-tooltip-btn {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s ease;
}

.comment-tooltip-btn:hover {
  background-color: #0056b3;
}

/* Comment Input Panel */
.comment-input-panel {
  background: #f8f9fa;
  border: 2px solid #007bff;
  border-radius: 12px;
  padding: 20px;
  margin-top: 20px;
}

.comment-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.comment-panel-header h3 {
  margin: 0;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #999;
}

.close-btn:hover {
  color: #333;
}

.comment-quote-preview {
  background: white;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.comment-quote-preview p:first-child {
  margin: 0 0 8px 0;
  font-weight: 600;
  color: #555;
  font-size: 0.9rem;
}

.quote {
  margin: 0;
  font-style: italic;
  color: #007bff;
}

.comment-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  font-family: inherit;
  resize: vertical;
  min-height: 100px;
  margin-bottom: 12px;
}

.comment-textarea:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

.comment-panel-actions {
  display: flex;
  gap: 12px;
}

/* Comments Display */
.comments-display {
  margin-top: 40px;
  padding-top: 30px;
  border-top: 2px solid #e0e0e0;
}

.comments-display h3 {
  color: #333;
  margin-bottom: 20px;
}

.comment-block {
  background: #f8f9fa;
  border-left: 4px solid #007bff;
  padding: 16px;
  margin-bottom: 20px;
  border-radius: 8px;
}

.comment-quote-section {
  background: white;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 12px;
}

.comment-quote {
  margin: 0;
  font-style: italic;
  color: #007bff;
  font-weight: 500;
}

.comment-content {
  margin-bottom: 12px;
}

.comment-text {
  margin: 0 0 8px 0;
  color: #333;
  line-height: 1.6;
}

.comment-meta {
  display: flex;
  gap: 12px;
  font-size: 0.85rem;
  color: #999;
}

.comment-author {
  font-weight: 600;
  color: #666;
}

.reply-btn {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s ease;
}

.reply-btn:hover {
  background-color: #0056b3;
}

/* Replies */
.replies {
  margin-top: 12px;
  padding-left: 20px;
  border-left: 2px solid #ddd;
}

.reply {
  background: white;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 8px;
}

.reply-text {
  margin: 0 0 6px 0;
  color: #333;
}

.reply-meta {
  display: flex;
  gap: 12px;
  font-size: 0.85rem;
  color: #999;
}

.reply-author {
  font-weight: 600;
  color: #666;
}

/* Reply Input */
.reply-input-section {
  margin-top: 12px;
  padding: 12px;
  background: white;
  border-radius: 6px;
}

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
}

.reply-textarea:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

.reply-actions {
  display: flex;
  gap: 8px;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn-primary:hover {
  background-color: #0056b3;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background-color: #5a6268;
}

@media (max-width: 768px) {
  .story-metadata {
    flex-direction: column;
    padding: 20px;
  }

  .cover {
    width: 100%;
    height: auto;
  }

  .chapter-content {
    padding: 20px;
  }

  .chapter-tabs {
    overflow-x: auto;
  }

  .chapter-tab {
    flex: 0 0 auto;
    min-width: 150px;
  }

  .comment-block {
    padding: 12px;
  }

  .reply-input-section {
    padding: 10px;
  }
}
</style>
