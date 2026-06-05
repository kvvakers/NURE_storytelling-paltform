<template>
  <div v-if="story" class="story-page _page">
    <div class="_container">
      <!-- Story Metadata -->
      <div class="story-metadata panel _flex _gap-x-32">
        <div>
          <img
            :src="resolveMedia(story.cover) || placeholderImg"
            @error="(e: Event) => { const img = e.target as HTMLImageElement; img.src = placeholderImg; img.onerror = null; }"
            :alt="story.title"
            class="cover"
          />
        </div>
        <div class="story-info _flex-1">
          <h1 class="_h1">{{ story.title }}</h1>
          <p>
            <b>Автор: </b>
            <span
              v-if="story.ownerId"
              class="author-link"
              @click="router.push({ name: RouteName.PROFILE, params: { id: story.ownerId } })"
            >{{ story.author }}</span>
            <span v-else>{{ story.author }}</span>
          </p>
          <p><b>Опис:</b> {{ story.description }}</p>
          <div class="rating-row">
            <b>Рейтинг:</b>
            <span class="rating-value">{{ story.rating > 0 ? story.rating.toFixed(1) : '—' }}/10</span>
            <span v-if="story.ratingCount" class="rating-count">({{ story.ratingCount }} {{ ratingCountLabel(story.ratingCount) }})</span>
          </div>
          <div v-if="!story.isMine && userStore.isAuthorized" class="rating-stars-row">
            <span class="rating-label">Ваша оцінка:</span>
            <div class="stars-input">
              <button
                v-for="n in 10"
                :key="n"
                type="button"
                class="star-btn"
                :class="{ active: n <= (ratingHover || userRating || 0) }"
                @mouseenter="ratingHover = n"
                @mouseleave="ratingHover = 0"
                @click="submitRating(n)"
              >★</button>
            </div>
            <span v-if="userRating" class="user-rating-val">{{ userRating }}/10</span>
          </div>
          <p class="_flex _ai-c _gap-6">
            <b>Вподобань:</b>
            <Heart :size="14" class="like-icon-static" />
            <span>{{ story.likeCount ?? 0 }}</span>
          </p>
          <p><b>Дата публікації:</b> {{ new Date(story.createdAt).toLocaleDateString('uk-UA') }}</p>
          <p>
            <b>Статус:</b>
            <span :class="statusBadgeClass(story.status)">{{ statusLabel(story.status) }}</span>
          </p>
          <p v-if="story.seriesTitle"><b>Серія:</b> {{ story.seriesTitle }}</p>
          <p v-if="story.characters"><b>Персонажі:</b> {{ story.characters }}</p>
          <div v-if="story.genres?.length" class="meta-tags _flex _flex-wrap _gap-8">
            <b>Жанри:</b>
            <span v-for="g in story.genres" :key="g" class="badge-primary">{{ g }}</span>
          </div>
          <div v-if="story.tags?.length" class="meta-tags _flex _flex-wrap _gap-8">
            <b>Теги:</b>
            <span v-for="t in story.tags" :key="t" class="badge-secondary">{{ t }}</span>
          </div>
          <div v-if="story.coAuthors && story.coAuthors.length > 0" class="co-authors-row">
            <b>Співавтори:</b>
            <span
              v-for="ca in story.coAuthors"
              :key="ca.id"
              class="coauthor-chip"
              @click="router.push({ name: RouteName.PROFILE, params: { id: ca.id } })"
            >{{ ca.username || ca.email }}</span>
          </div>
          <div v-if="story.isMine || story.isCoAuthor" class="story-owner-actions _flex _gap-12">
            <button class="btn btn-secondary _flex _ai-c _gap-6" @click="goToEditStory"><Pencil :size="15" />Редагувати</button>
            <button v-if="story.isMine" class="btn btn-danger _flex _ai-c _gap-6" @click="deleteStoryModal = true"><Trash2 :size="15" />Видалити</button>
          </div>
          <div v-else-if="userStore.isAuthorized" class="story-owner-actions _flex _gap-12">
            <button
              class="btn _flex _ai-c _gap-6"
              :class="libraryStatus.liked ? 'btn-liked' : 'btn-secondary'"
              @click="toggleLike"
              :disabled="likeLoading"
            >
              <Heart :size="15" :fill="libraryStatus.liked ? 'currentColor' : 'none'" />
              {{ libraryStatus.liked ? 'Вподобано' : 'Вподобати' }}
            </button>
            <button v-if="libraryStatus.inLibrary" class="btn btn-secondary _flex _ai-c _gap-6" @click="removeFromLibrary">
              <BookmarkCheck :size="15" />В бібліотеці
            </button>
            <button v-else class="btn btn-secondary _flex _ai-c _gap-6" @click="openAddToLibrary">
              <BookmarkPlus :size="15" />До бібліотеки
            </button>
          </div>
        </div>
      </div>

      <!-- Chapters list -->
      <div class="chapters-section panel">
        <div class="chapters-header _flex _ai-c _jc-sb">
          <h2>Глави ({{ chapters.length }})</h2>
          <button v-if="story.isMine || story.isCoAuthor" type="button" class="btn btn-primary _flex _ai-c _gap-6" @click="goToAddChapter">
            <Plus :size="16" />Додати главу
          </button>
        </div>

        <div v-if="chapters.length === 0" class="no-chapters">
          Глав ще немає.
        </div>

        <div v-else class="chapter-list _flex _flex-col _gap-12">
          <div
            v-for="(ch, idx) in chapters"
            :key="idx"
            class="chapter-card _flex-col _ai-fs"
            :class="{
              'chapter-card--bookmarked': !story.isMine && libraryStatus.bookmarkChapterIndex === idx,
              'chapter-card--draft': ch.isDraft,
              'chapter-card--hidden': ch.isHidden,
            }"
          >
            <div class="chapter-card-main _flex _flex-col _gap-4 _flex-1 _min-w-0" @click="goToRead(idx)">
              <div class="_flex _ai-c _gap-8">
                <span class="chapter-number">Глава {{ idx + 1 }}</span>
                <span v-if="ch.isDraft" class="draft-badge">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  Чернетка
                </span>
                <span v-if="!ch.isDraft && (ch.draftTitle || ch.draftContent) && (story.isMine || story.isCoAuthor)" class="pending-draft-badge">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  Є чернетка
                </span>
                <span v-if="ch.isHidden && (story.isMine || story.isCoAuthor)" class="hidden-badge">
                  <EyeOff :size="11" />Приховано
                </span>
                <span v-if="!story.isMine && libraryStatus.bookmarkChapterIndex === idx" class="bookmark-badge">
                  <BookmarkCheck :size="13" />Закладка
                </span>
              </div>
              <span class="chapter-title">{{ ch.title }}</span>
              <span class="chapter-preview">{{ stripHtml(ch.content).slice(0, 120) }}{{ ch.content.length > 120 ? '…' : '' }}</span>
            </div>
            <div v-if="story.isMine || story.isCoAuthor" class="chapter-card-actions _flex _gap-8 _shrink-0 _jc-fe">
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
                class="btn btn-secondary _flex _ai-c _gap-6"
                :class="{ 'btn-hidden-active': ch.isHidden }"
                @click.stop="toggleHideChapter(idx)"
                :title="ch.isHidden ? 'Показати' : 'Приховати'"
              >
                <EyeOff v-if="ch.isHidden" :size="14" />
                <Eye v-else :size="14" />
                {{ ch.isHidden ? 'Показати' : 'Приховати' }}
              </button>
              <button
                v-if="story.isMine"
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

      <!-- Story Comments -->
      <div class="comments-section panel">
        <h2 class="comments-title">Коментарі ({{ storyComments.length }})</h2>

        <div v-if="userStore.isAuthorized" class="comment-form">
          <textarea
            v-model="newCommentText"
            class="comment-textarea"
            placeholder="Напишіть коментар до книги..."
            rows="3"
          ></textarea>
          <button
            class="btn btn-primary"
            :disabled="!newCommentText.trim() || isSubmittingComment"
            @click="submitStoryComment"
          >{{ isSubmittingComment ? 'Публікація...' : 'Опублікувати' }}</button>
        </div>
        <p v-else class="comments-login-hint">Увійдіть, щоб залишити коментар.</p>

        <div v-if="storyComments.length === 0" class="no-comments">Коментарів ще немає.</div>

        <div class="comment-list _flex _flex-col _gap-12">
          <div v-for="comment in storyComments" :key="comment.id" class="comment-item">
            <div class="comment-header _flex _ai-c _jc-sb">
              <span class="comment-author">{{ comment.authorName || 'Читач' }}</span>
              <div class="_flex _ai-c _gap-8">
                <span class="comment-date">{{ formatCommentDate(comment.createdAt) }}</span>
                <button
                  v-if="canDeleteStoryComment(comment)"
                  class="btn-icon comment-delete"
                  title="Видалити"
                  @click="deleteStoryComment(comment.id)"
                >✕</button>
              </div>
            </div>
            <p class="comment-text">{{ comment.text }}</p>

            <div v-if="comment.replies?.length" class="reply-list _flex _flex-col _gap-8">
              <div v-for="reply in comment.replies" :key="reply.id" class="reply-item">
                <div class="comment-header _flex _ai-c _jc-sb">
                  <span class="comment-author reply-author">{{ reply.authorName || 'Читач' }}</span>
                  <span class="comment-date">{{ formatCommentDate(reply.createdAt) }}</span>
                </div>
                <p class="comment-text">{{ reply.text }}</p>
              </div>
            </div>

            <div v-if="userStore.isAuthorized" class="reply-form-toggle">
              <button class="btn-link" @click="toggleStoryReply(comment.id)">
                {{ activeReplyId === comment.id ? 'Скасувати' : 'Відповісти' }}
              </button>
              <div v-if="activeReplyId === comment.id" class="reply-input-row _flex _gap-8">
                <input
                  v-model="replyTexts[comment.id]"
                  class="form-input reply-input"
                  placeholder="Ваша відповідь..."
                  @keydown.enter.prevent="submitStoryReply(comment.id)"
                />
                <button
                  class="btn btn-primary btn-sm"
                  :disabled="!replyTexts[comment.id]?.trim()"
                  @click="submitStoryReply(comment.id)"
                >Надіслати</button>
              </div>
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

  <!-- Add to Library Modal -->
  <teleport to="body">
    <div v-if="showAddToLibraryModal" class="modal-overlay" @click.self="showAddToLibraryModal = false">
      <div class="modal">
        <div class="modal-header _flex _ai-c _jc-sb" style="margin-bottom:16px">
          <h3 class="modal-title" style="margin:0">Додати до бібліотеки</h3>
          <button type="button" class="btn-icon" @click="showAddToLibraryModal = false">✕</button>
        </div>

        <div v-if="loadingCategories" style="padding:16px 0;text-align:center;color:#888">Завантаження...</div>
        <template v-else>
          <div class="form-group" style="margin-bottom:16px">
            <label>Категорія <span style="color:#aaa;font-weight:400">(необов'язково)</span></label>
            <div v-if="userCategories.length === 0" class="library-hint">
              <p>У вас ще немає категорій.</p>
              <p>Книга буде додана до розділу «Всі».</p>
              <p>
                Категорії можна створити в
                <router-link :to="{ name: RouteName.MY_PROFILE }" @click="showAddToLibraryModal = false" class="inline-link">профілі → Моя бібліотека</router-link>.
              </p>
            </div>
            <div v-else class="category-list">
              <label class="category-option _flex _ai-c">
                <input type="radio" :value="null" v-model="selectedCategoryId" class="radio-input" />
                <span class="text-muted">Без категорії</span>
              </label>
              <label
                v-for="cat in userCategories"
                :key="cat.id"
                class="category-option _flex _ai-c"
              >
                <input type="radio" :value="cat.id" v-model="selectedCategoryId" class="radio-input" />
                <span>{{ cat.title }}</span>
              </label>
            </div>
          </div>
        </template>

        <div class="modal-actions">
          <button class="btn btn-secondary" @click="showAddToLibraryModal = false">Скасувати</button>
          <button
            class="btn btn-primary"
            :disabled="addingToLibrary || loadingCategories"
            @click="submitAddToLibrary"
          >{{ addingToLibrary ? 'Додавання...' : 'Додати' }}</button>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useUserStore } from "../stores/user";
import { useToast } from "../composables/useToast";
import { RouteName } from "../router/keys";
import { api } from '../utils/api';
import { resolveMedia } from '../utils/resolveMedia';
import placeholderImg from '../assets/placeholder.jpg';
import { Pencil, Trash2, Plus, BookmarkPlus, BookmarkCheck, Heart, EyeOff, Eye } from "lucide-vue-next";

interface Chapter {
  title: string;
  content: string;
  isDraft?: boolean;
  isHidden?: boolean;
  draftTitle?: string;
  draftContent?: string;
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
  author: string;
  description: string;
  rating: number;
  createdAt: string;
  cover: string;
  genres: string[];
  tags: string[];
  characters?: string;
  chapters: Chapter[];
  ownerId?: number;
  isMine?: boolean;
  isCoAuthor?: boolean;
  coAuthors?: CoAuthorUser[];
  seriesId?: number | null;
  seriesTitle?: string | null;
  status?: string;
  likeCount?: number;
  isLiked?: boolean;
  ratingCount?: number;
}

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const { show: showToast } = useToast();

const userRating = ref<number | null>(null);
const ratingHover = ref(0);

const ratingCountLabel = (n: number) => {
  if (n % 10 === 1 && n % 100 !== 11) return 'оцінка';
  if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return 'оцінки';
  return 'оцінок';
};

const submitRating = async (stars: number) => {
  if (!story.value) return;
  try {
    const res = await api.post(`/stories/${story.value.id}/rate`, { rating: stars });
    userRating.value = stars;
    story.value.rating = res.averageRating;
    story.value.ratingCount = res.ratingCount;
    showToast('Оцінку збережено', 'success');
  } catch {
    showToast('Помилка при оцінюванні', 'error');
  }
};


const deleteModal = ref({ visible: false, chapterIndex: -1, chapterTitle: "" });
const deleteStoryModal = ref(false);

const STATUS_OPTIONS = [
  { value: 'in_progress', label: 'В процесі' },
  { value: 'completed',   label: 'Завершено' },
  { value: 'frozen',      label: 'Заморожено' },
] as const;

const statusLabel = (s?: string) =>
  STATUS_OPTIONS.find(o => o.value === s)?.label ?? 'В процесі';

const statusBadgeClass = (s?: string) => ({
  'badge-ongoing':   !s || s === 'in_progress',
  'badge-completed': s === 'completed',
  'badge-frozen':    s === 'frozen',
});

interface StoryCommentReply {
  id: string;
  text: string;
  authorId?: number;
  authorName?: string;
  createdAt?: string;
}

interface StoryComment {
  id: string;
  text: string;
  authorId?: number;
  authorName?: string;
  createdAt?: string;
  replies?: StoryCommentReply[];
}

const story = ref<Story | null>(null);
const chapters = ref<Chapter[]>([]);
const storyComments = ref<StoryComment[]>([]);
const newCommentText = ref('');
const isSubmittingComment = ref(false);
const activeReplyId = ref<string | null>(null);
const replyTexts = ref<Record<string, string>>({});

const formatCommentDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

const canDeleteStoryComment = (comment: StoryComment) => {
  if (!userStore.isAuthorized) return false;
  const me = (userStore as any).user?.id ?? (userStore as any).userId;
  return comment.authorId === me || story.value?.isMine;
};

const loadStoryComments = async (id: number) => {
  try {
    storyComments.value = await api.get(`/stories/${id}/comments`);
  } catch { storyComments.value = []; }
};

const submitStoryComment = async () => {
  if (!story.value || !newCommentText.value.trim()) return;
  isSubmittingComment.value = true;
  try {
    const comment = await api.post(`/stories/${story.value.id}/comments`, { text: newCommentText.value.trim() });
    storyComments.value.push(comment);
    newCommentText.value = '';
  } catch { showToast('Помилка при публікації', 'error'); }
  finally { isSubmittingComment.value = false; }
};

const deleteStoryComment = async (commentId: string) => {
  if (!story.value) return;
  try {
    await api.del(`/stories/${story.value.id}/comments/${commentId}`);
    storyComments.value = storyComments.value.filter(c => c.id !== commentId);
  } catch { showToast('Помилка при видаленні', 'error'); }
};

const toggleStoryReply = (commentId: string) => {
  activeReplyId.value = activeReplyId.value === commentId ? null : commentId;
};

const submitStoryReply = async (commentId: string) => {
  if (!story.value) return;
  const text = replyTexts.value[commentId]?.trim();
  if (!text) return;
  try {
    const reply = await api.post(`/stories/${story.value.id}/comments/${commentId}/replies`, { text });
    const comment = storyComments.value.find(c => c.id === commentId);
    if (comment) {
      comment.replies = [...(comment.replies ?? []), reply];
    }
    replyTexts.value[commentId] = '';
    activeReplyId.value = null;
  } catch { showToast('Помилка при відповіді', 'error'); }
};

// Library
const libraryStatus = ref({ inLibrary: false, liked: false, categories: [] as number[], bookmarkChapterIndex: null as number | null });
const likeLoading = ref(false);
const showAddToLibraryModal = ref(false);
const userCategories = ref<{ id: number; title: string }[]>([]);
const selectedCategoryId = ref<number | null>(null);
const addingToLibrary = ref(false);
const loadingCategories = ref(false);

const loadStory = async () => {
  story.value = null;
  userRating.value = null;
  storyComments.value = [];
  libraryStatus.value = { inLibrary: false, liked: false, categories: [], bookmarkChapterIndex: null };
  const id = Number(route.params.id);
  if (!id) return;
  try {
    const data = await api.get(`/stories/${id}`);
    story.value = data;
    chapters.value = data.chapters || [];
    void loadStoryComments(id);
    if (userStore.isAuthorized && !data.isMine) {
      try {
        libraryStatus.value = await api.get(`/library/check/${id}`);
      } catch { /* ignore */ }
      try {
        const ratingRes = await api.get(`/stories/${id}/my-rating`);
        userRating.value = ratingRes.userRating;
      } catch { /* ignore */ }
    }
  } catch (e) {
    console.error(e);
  }
};

const openAddToLibrary = async () => {
  selectedCategoryId.value = null;
  loadingCategories.value = true;
  showAddToLibraryModal.value = true;
  try {
    userCategories.value = await api.get('/library/categories');
  } catch {
    userCategories.value = [];
  } finally {
    loadingCategories.value = false;
  }
};

const submitAddToLibrary = async () => {
  if (!story.value) return;
  addingToLibrary.value = true;
  try {
    await api.post(`/library/${story.value.id}`, { categoryId: selectedCategoryId.value ?? null });
    libraryStatus.value.inLibrary = true;
    if (selectedCategoryId.value != null && !libraryStatus.value.categories.includes(selectedCategoryId.value)) {
      libraryStatus.value.categories.push(selectedCategoryId.value);
    }
    showAddToLibraryModal.value = false;
    showToast('Додано до бібліотеки', 'success');
  } catch {
    showToast('Помилка при додаванні', 'error');
  } finally {
    addingToLibrary.value = false;
  }
};

const removeFromLibrary = async () => {
  if (!story.value) return;
  try {
    await api.del(`/library/${story.value.id}`);
    libraryStatus.value = { inLibrary: false, liked: false, categories: [], bookmarkChapterIndex: null };
    if (story.value) story.value.likeCount = 0;
    showToast('Видалено з бібліотеки', 'success');
  } catch {
    showToast('Помилка при видаленні', 'error');
  }
};

const toggleLike = async () => {
  if (!story.value || likeLoading.value) return;
  likeLoading.value = true;
  try {
    if (libraryStatus.value.liked) {
      const res = await api.del(`/library/${story.value.id}/like`);
      libraryStatus.value.liked = false;
      libraryStatus.value.inLibrary = false;
      libraryStatus.value.categories = [];
      libraryStatus.value.bookmarkChapterIndex = null;
      if (story.value) story.value.likeCount = res.likeCount ?? Math.max(0, (story.value.likeCount ?? 1) - 1);
    } else {
      const res = await api.post(`/library/${story.value.id}/like`, {});
      libraryStatus.value.liked = true;
      libraryStatus.value.inLibrary = true;
      if (story.value) story.value.likeCount = res.likeCount ?? (story.value.likeCount ?? 0) + 1;
    }
  } catch {
    showToast('Помилка', 'error');
  } finally {
    likeLoading.value = false;
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

const goToEditStory = () => {
  if (!story.value) return;
  router.push({ name: RouteName.EDIT_STORY, params: { id: story.value.id } });
};

const goToRead = (idx: number) => {
  if (!story.value) return;
  router.push({ name: RouteName.READ_CHAPTER, params: { id: story.value.id, chapterIndex: idx } });
};

const goToAddChapter = () => {
  if (!story.value) return;
  router.push({
    name: RouteName.WRITE_CHAPTER,
    params: { storyId: String(story.value.id) },
  });
};

const editChapter = (idx: number) => {
  if (!story.value) return;
  const chapter = chapters.value[idx];
  if (!chapter) return;
  router.push({
    name: RouteName.WRITE_CHAPTER,
    params: { storyId: String(story.value.id), chapterIndex: String(idx) },
  });
};

const toggleHideChapter = async (idx: number) => {
  if (!story.value) return;
  const chapter = chapters.value[idx];
  if (!chapter) return;
  const newHidden = !chapter.isHidden;
  try {
    await api.patch(`/stories/${story.value.id}/chapters/${idx}`, { isHidden: newHidden });
    chapter.isHidden = newHidden;
    showToast(newHidden ? 'Главу приховано' : 'Главу показано', 'success');
  } catch {
    showToast('Помилка при зміні видимості', 'error');
  }
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
  object-fit: contain;
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

.chapter-card--bookmarked {
  border-color: #fde68a;
  background-color: #fffbeb;
}

.chapter-card--bookmarked:hover {
  border-color: #f59e0b;
}

.bookmark-badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #92400e;
  background-color: #fef3c7;
  border: 1px solid #fde68a;
  border-radius: 10px;
  padding: 1px 7px;
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

.meta-tags { margin: 8px 0; align-items: center; }
.meta-tags b { white-space: nowrap; }

.badge-completed,
.badge-ongoing,
.badge-frozen {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
  margin-left: 4px;
}

.badge-completed { background-color: #d4edda; color: #155724; }
.badge-ongoing   { background-color: #fff3cd; color: #856404; }
.badge-frozen    { background-color: #e2e3e5; color: #383d41; }

.badge-secondary {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.8rem;
  background-color: #e9ecef;
  color: #495057;
}

.co-authors-row {
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.coauthor-chip {
  display: inline-block;
  padding: 3px 10px;
  background: var(--color-bg-secondary, #f0f4ff);
  border: 1px solid var(--color-primary);
  color: var(--color-primary);
  border-radius: 20px;
  font-size: 0.82rem;
  cursor: pointer;
  transition: background 0.2s;
}

.coauthor-chip:hover {
  background: var(--color-primary);
  color: #fff;
}

.story-owner-actions { margin-top: 20px; }

.series-header {
  margin-bottom: 8px;
}

.series-header label {
  margin-bottom: 0;
}

.series-list {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.series-empty {
  color: var(--color-text-muted);
  font-size: 0.88rem;
  margin: 0;
}

.series-option {
  cursor: pointer;
  padding: 5px 8px;
  border-radius: var(--radius-sm);
  transition: background-color 0.2s;
  gap: 8px;
  font-size: 0.9rem;
}

.series-option:hover { background-color: #f5f5f5; }

.radio-input {
  width: 15px;
  height: 15px;
  cursor: pointer;
  accent-color: var(--color-primary);
  flex-shrink: 0;
}

.text-muted { color: var(--color-text-muted); }

.btn-sm { padding: 5px 10px; font-size: 0.82rem; }

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  color: var(--color-text-muted);
  padding: 2px 6px;
  line-height: 1;
}

.btn-icon:hover { color: var(--color-text); }

.btn-liked {
  background-color: #fee2e2;
  color: #dc2626;
  border: 1px solid #fca5a5;
}

.btn-liked:hover {
  background-color: #fecaca;
}

.like-icon-static {
  color: #dc2626;
  flex-shrink: 0;
}

.rating-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 8px 0;
  color: #555;
}

.rating-value {
  font-weight: 600;
  color: #333;
}

.rating-count {
  font-size: 0.85rem;
  color: #999;
}

.rating-stars-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 4px 0 12px;
}

.rating-label {
  font-size: 0.9rem;
  color: #555;
  white-space: nowrap;
}

.stars-input {
  display: flex;
  gap: 2px;
}

.star-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.5rem;
  color: #d1d5db;
  padding: 0 1px;
  line-height: 1;
  transition: color 0.1s, transform 0.1s;
}

.star-btn:hover,
.star-btn.active {
  color: #f59e0b;
}

.star-btn:hover {
  transform: scale(1.15);
}

.user-rating-val {
  font-size: 0.88rem;
  color: #f59e0b;
  font-weight: 600;
}

.library-hint {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 12px 14px;
  background: #fafafa;
  font-size: 0.88rem;
  color: #666;
  line-height: 1.6;
}

.library-hint p { margin: 2px 0; }

.inline-link {
  color: var(--color-primary, #4f46e5);
  text-decoration: underline;
}

.category-list {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 240px;
  overflow-y: auto;
}

.category-option {
  cursor: pointer;
  padding: 5px 8px;
  border-radius: var(--radius-sm);
  transition: background-color 0.2s;
  gap: 8px;
  font-size: 0.9rem;
}

.category-option:hover { background-color: #f5f5f5; }

.chapter-card--draft {
  border-color: #e2e8f0;
  background-color: #f8fafc;
  opacity: 0.9;
}

.chapter-card--draft:hover {
  border-color: #94a3b8;
}

.chapter-card--hidden {
  border-color: #e9d5ff;
  background-color: #faf5ff;
  opacity: 0.85;
}

.chapter-card--hidden:hover {
  border-color: #d8b4fe;
}

.draft-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.72rem;
  font-weight: 600;
  color: #64748b;
  background-color: #f1f5f9;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  padding: 2px 8px;
}

.pending-draft-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.72rem;
  font-weight: 600;
  color: #92400e;
  background-color: #fef3c7;
  border: 1px solid #fcd34d;
  border-radius: 10px;
  padding: 2px 8px;
}

.hidden-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.72rem;
  font-weight: 600;
  color: #6b21a8;
  background-color: #f3e8ff;
  border: 1px solid #d8b4fe;
  border-radius: 10px;
  padding: 2px 8px;
}

.btn-hidden-active {
  background-color: #f3e8ff;
  color: #6b21a8;
  border-color: #d8b4fe;
}

.btn-hidden-active:hover {
  background-color: #e9d5ff;
}

.comments-section {
  padding: 32px 40px;
  margin-bottom: 40px;
}

.comments-title {
  margin: 0 0 20px;
  font-size: 1.4rem;
  color: var(--color-text);
}

.comment-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 24px;
}

.comment-textarea {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
  resize: vertical;
  font-family: inherit;
  box-sizing: border-box;
}

.comment-textarea:focus {
  outline: none;
  border-color: var(--color-primary);
}

.comments-login-hint {
  font-size: 0.88rem;
  color: var(--color-text-muted);
  margin-bottom: 20px;
}

.no-comments {
  color: #999;
  text-align: center;
  padding: 24px 0;
  font-size: 0.95rem;
}

.comment-item {
  border: 1px solid #e8e8e8;
  border-radius: var(--radius-md);
  padding: 14px 16px;
}

.comment-header {
  margin-bottom: 6px;
}

.comment-author {
  font-weight: 600;
  font-size: 0.9rem;
  color: #333;
}

.comment-date {
  font-size: 0.8rem;
  color: #999;
}

.comment-delete {
  font-size: 0.75rem;
  opacity: 0.6;
  transition: opacity 0.15s;
}

.comment-delete:hover { opacity: 1; }

.comment-text {
  margin: 0 0 8px;
  font-size: 0.92rem;
  color: #444;
  line-height: 1.6;
  white-space: pre-wrap;
}

.reply-list {
  margin: 8px 0;
  padding-left: 16px;
  border-left: 2px solid #e8e8e8;
}

.reply-item {
  background: #fafafa;
  border-radius: var(--radius-sm);
  padding: 8px 12px;
}

.reply-author { color: var(--color-primary); }

.reply-form-toggle { margin-top: 6px; }

.btn-link {
  background: none;
  border: none;
  color: var(--color-primary);
  cursor: pointer;
  font-size: 0.82rem;
  padding: 0;
  text-decoration: underline;
}

.reply-input-row {
  margin-top: 8px;
  align-items: center;
}

.reply-input {
  flex: 1;
  padding: 6px 10px;
  font-size: 0.88rem;
}

@media (max-width: 768px) {
  .story-metadata { flex-direction: column; padding: 20px; }
  .cover { width: 100%; height: auto; }
  .chapters-section { padding: 20px; }
  .chapter-card-actions { width: 100%; }
  .comments-section { padding: 20px; }
}
</style>