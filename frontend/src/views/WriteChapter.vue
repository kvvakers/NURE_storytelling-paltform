<template>
  <div class="write-chapter">
    <div class="chapter-container">
      <div class="chapter-header">
        <h1>Напишите первую главу</h1>
        <p class="story-title">{{ storyData.title }}</p>
      </div>

      <form @submit.prevent="submitChapter" class="chapter-form">
        <!-- Chapter Title -->
        <div class="form-group">
          <input
            v-model="chapterData.title"
            type="text"
            placeholder="Название главы"
            required
            class="chapter-title-input"
          />
        </div>

        <!-- Formatting Toolbar -->
        <div class="toolbar">
          <div class="toolbar-group">
            <button type="button" @click="applyFormat('bold')" class="toolbar-btn" title="Жирный">
              <strong>B</strong>
            </button>
            <button type="button" @click="applyFormat('italic')" class="toolbar-btn" title="Итальик">
              <i>I</i>
            </button>
            <button type="button" @click="applyFormat('underline')" class="toolbar-btn" title="Подчеркнутый">
              <u>U</u>
            </button>
            <button type="button" @click="applyFormat('strikethrough')" class="toolbar-btn" title="Зачеркнутый">
              <s>S</s>
            </button>
          </div>

          <div class="toolbar-group">
            <button type="button" @click="applyAlignment('left')" class="toolbar-btn" title="Выровнять слева">
              ⬅
            </button>
            <button type="button" @click="applyAlignment('center')" class="toolbar-btn" title="Выровнять по центру">
              ↔
            </button>
            <button type="button" @click="applyAlignment('right')" class="toolbar-btn" title="Выровнять справа">
              ➡
            </button>
          </div>

          <div class="toolbar-group">
            <button 
              type="button" 
              @click="toggleCommentMode" 
              class="toolbar-btn"
              :class="{ active: isCommentMode }"
              title="Режим комментариев"
            >
              💬
            </button>
          </div>
        </div>

        <!-- Chapter Content Editor -->
        <div class="editor-container">
          <div
            ref="contentEditable"
            contenteditable="true"
            @input="updateContent"
            @mouseup="handleTextSelection"
            class="chapter-content-editor"
            placeholder="Начните писать вашу историю здесь..."
          ></div>

          <!-- Comments Panel -->
          <div v-if="showCommentPanel" class="comment-panel">
            <div class="comment-header">
              <h3>Комментарии к выделению</h3>
              <button type="button" @click="cancelComment" class="close-btn">×</button>
            </div>
            <div class="comment-input-group">
              <textarea
                v-model="newComment"
                placeholder="Введите ваш комментарий..."
                class="comment-input"
              ></textarea>
              <button type="button" @click="addComment" class="btn btn-primary">
                Добавить комментарий
              </button>
            </div>
          </div>
        </div>

        <!-- Comments Display -->
        <div v-if="comments.length > 0" class="comments-section">
          <h3>Комментарии ({{ comments.length }})</h3>
          <div v-for="(comment, index) in comments" :key="index" class="comment-item">
            <div class="comment-text">
              <span class="comment-quote">"{{ comment.selectedText }}"</span>
              <p>{{ comment.text }}</p>
            </div>
            <button type="button" @click="deleteComment(index)" class="delete-comment-btn">
              Удалить
            </button>
          </div>
        </div>

        <!-- Submit Actions -->
        <div class="form-actions">
          <button type="submit" class="btn btn-primary">Сохранить главу</button>
          <button type="button" @click="saveDraft" class="btn btn-secondary">Сохранить как черновик</button>
          <button type="button" @click="goBack" class="btn btn-outline">Назад</button>
        </div>
      </form>

      <!-- Word Count -->
      <div class="word-count">
        Слов: {{ wordCount }} | Символов: {{ chapterData.content.length }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { RouteName } from "../router/keys";

const router = useRouter();
const route = useRoute();

interface Comment {
  selectedText: string;
  text: string;
  position?: number;
}

const storyData = ref({
  title: "",
  description: "",
  characters: "",
  genres: [] as string[],
  tags: [] as string[],
  language: "",
  cover: null as File | null,
});

const chapterData = ref({
  title: "Глава 1",
  content: "",
});

const contentEditable = ref<HTMLElement | null>(null);
const isCommentMode = ref(false);
const showCommentPanel = ref(false);
const newComment = ref("");
const selectedText = ref("");
const comments = ref<Comment[]>([]);

const wordCount = computed(() => {
  const text = chapterData.value.content.replace(/<[^>]*>/g, "");
  return text
    .trim()
    .split(/\s+/)
    .filter(word => word.length > 0)
    .length;
});

onMounted(() => {
  if (route.params.storyData) {
    try {
      storyData.value = JSON.parse(route.params.storyData as string);
    } catch (e) {
      console.error("Failed to parse story data:", e);
    }
  }
});

const updateContent = () => {
  if (contentEditable.value) {
    chapterData.value.content = contentEditable.value.innerHTML;
    console.log("Updated chapter content:", chapterData.value.content);
  }
};

const handleTextSelection = () => {
  const selection = window.getSelection();
  if (selection && selection.toString().length > 0) {
    selectedText.value = selection.toString();
    
    if (isCommentMode.value) {
      showCommentPanel.value = true;
    }
  }
};

const applyFormat = (format: string) => {
  const selection = window.getSelection();
  if (!selection || selection.toString().length === 0) {
    alert("Пожалуйста, выделите текст сначала");
    return;
  }

  document.execCommand("styleWithCSS", false, "true");

  switch (format) {
    case "bold":
      document.execCommand("bold", false);
      break;
    case "italic":
      document.execCommand("italic", false);
      break;
    case "underline":
      document.execCommand("underline", false);
      break;
    case "strikethrough":
      document.execCommand("strikethrough", false);
      break;
  }

  updateContent();
  contentEditable.value?.focus();
};

const applyAlignment = (alignment: string) => {
  const selection = window.getSelection();
  if (!selection) return;

  let command = "";
  switch (alignment) {
    case "left":
      command = "justifyLeft";
      break;
    case "center":
      command = "justifyCenter";
      break;
    case "right":
      command = "justifyRight";
      break;
  }

  if (command) {
    document.execCommand(command, false);
    updateContent();
    contentEditable.value?.focus();
  }
};

const toggleCommentMode = () => {
  isCommentMode.value = !isCommentMode.value;
  if (!isCommentMode.value) {
    showCommentPanel.value = false;
  }
};

const addComment = () => {
  if (!selectedText.value.trim() || !newComment.value.trim()) {
    alert("Пожалуйста, выделите текст и введите комментарий");
    return;
  }

  comments.value.push({
    selectedText: selectedText.value,
    text: newComment.value,
  });

  cancelComment();
};

const cancelComment = () => {
  newComment.value = "";
  selectedText.value = "";
  showCommentPanel.value = false;
};

const deleteComment = (index: number) => {
  comments.value.splice(index, 1);
};

const submitChapter = async () => {
  if (!chapterData.value.title.trim()) {
    alert("Пожалуйста, введите название главы");
    return;
  }

  if (!chapterData.value.content.trim()) {
    alert("Пожалуйста, введите текст главы");
    return;
  }

  const plainText = chapterData.value.content.replace(/<[^>]*>/g, "");
  if (plainText.length < 100) {
    alert("Глава должна содержать как минимум 100 символов");
    return;
  }

  try {
    console.log("Submitting story with chapter:", {
      story: storyData.value,
      chapter: chapterData.value,
      comments: comments.value,
    });

    alert("История и первая глава успешно опубликованы!");
    router.push({ name: RouteName.HOME });
  } catch (error) {
    console.error("Error submitting chapter:", error);
    alert("Ошибка при публикации главы");
  }
};

const saveDraft = async () => {
  try {
    console.log("Saving as draft:", {
      story: storyData.value,
      chapter: chapterData.value,
      comments: comments.value,
    });

    alert("Черновик успешно сохранён!");
  } catch (error) {
    console.error("Error saving draft:", error);
    alert("Ошибка при сохранении черновика");
  }
};

const goBack = () => {
  if (confirm("Вы уверены? Все несохранённые данные будут потеряны.")) {
    router.push({ name: RouteName.HOME });
  }
};
</script>

<style scoped>
.write-chapter {
  min-height: 100vh;
  padding: 40px 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.chapter-container {
  max-width: 900px;
  margin: 0 auto;
  background: white;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.chapter-header {
  text-align: center;
  margin-bottom: 40px;
}

.chapter-header h1 {
  font-size: 2rem;
  color: #333;
  margin-bottom: 12px;
}

.story-title {
  font-size: 1.2rem;
  color: #666;
  font-weight: 500;
  margin: 0;
}

.chapter-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.chapter-title-input {
  padding: 16px;
  font-size: 1.3rem;
  font-weight: 600;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  transition: border-color 0.3s ease;
  font-family: inherit;
  text-align: center;
}

.chapter-title-input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

/* Toolbar */
.toolbar {
  display: flex;
  gap: 12px;
  padding: 12px;
  background-color: #f8f9fa;
  border: 1px solid #e0e0e0;
  border-radius: 8px 8px 0 0;
  flex-wrap: wrap;
}

.toolbar-group {
  display: flex;
  gap: 4px;
  border-right: 1px solid #ddd;
  padding-right: 12px;
}

.toolbar-group:last-child {
  border-right: none;
  padding-right: 0;
}

.toolbar-btn {
  padding: 6px 12px;
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.toolbar-btn:hover {
  background-color: #e9ecef;
  border-color: #999;
}

.toolbar-btn.active {
  background-color: #007bff;
  color: white;
  border-color: #007bff;
}

/* Editor Container */
.editor-container {
  position: relative;
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.chapter-content-editor {
  flex: 1;
  padding: 20px;
  font-size: 1.05rem;
  line-height: 1.8;
  border: 2px solid #e0e0e0;
  border-radius: 0 8px 8px 8px;
  font-family: "Georgia", serif;
  min-height: 500px;
  outline: none;
  transition: border-color 0.3s ease;
  background-color: white;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.chapter-content-editor:focus {
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

.chapter-content-editor[contenteditable]:empty:before {
  content: attr(placeholder);
  color: #999;
}

/* Comment Panel */
.comment-panel {
  position: absolute;
  right: 0;
  top: 0;
  width: 300px;
  background: white;
  border: 2px solid #007bff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 4px 12px rgba(0, 123, 255, 0.2);
  z-index: 100;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #eee;
}

.comment-header h3 {
  margin: 0;
  font-size: 1rem;
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

.comment-input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.comment-input {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
  font-family: inherit;
  resize: vertical;
  min-height: 80px;
}

.comment-input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.1);
}

/* Comments Section */
.comments-section {
  margin-top: 24px;
  padding: 16px;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.comments-section h3 {
  margin-top: 0;
  color: #333;
  font-size: 1.1rem;
}

.comment-item {
  background-color: white;
  padding: 12px;
  border-left: 4px solid #007bff;
  margin-bottom: 12px;
  border-radius: 4px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.comment-text {
  flex: 1;
}

.comment-quote {
  font-style: italic;
  color: #666;
  font-weight: 600;
}

.comment-item p {
  margin: 6px 0 0 0;
  color: #333;
}

.delete-comment-btn {
  background-color: #dc3545;
  color: white;
  border: none;
  padding: 4px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: background-color 0.2s ease;
  white-space: nowrap;
}

.delete-comment-btn:hover {
  background-color: #c82333;
}

/* Form Actions */
.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.btn {
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
}

.btn-primary {
  background-color: #007bff;
  color: white;
  flex: 2;
}

.btn-primary:hover {
  background-color: #0056b3;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
  flex: 1;
}

.btn-secondary:hover {
  background-color: #5a6268;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(108, 117, 125, 0.3);
}

.btn-outline {
  background-color: transparent;
  color: #666;
  border: 2px solid #ddd;
}

.btn-outline:hover {
  background-color: #f5f5f5;
  border-color: #999;
}

.word-count {
  text-align: center;
  color: #999;
  font-size: 0.9rem;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

@media (max-width: 768px) {
  .chapter-container {
    padding: 20px;
  }

  .chapter-header h1 {
    font-size: 1.5rem;
  }

  .chapter-title-input {
    font-size: 1.1rem;
  }

  .chapter-content-editor {
    min-height: 300px;
  }

  .editor-container {
    flex-direction: column;
  }

  .comment-panel {
    position: static;
    width: 100%;
  }

  .form-actions {
    flex-wrap: wrap;
  }

  .btn-primary,
  .btn-secondary,
  .btn-outline {
    flex: 1;
  }

  .toolbar {
    gap: 8px;
  }

  .toolbar-group {
    gap: 2px;
    padding-right: 8px;
  }
}
</style>
