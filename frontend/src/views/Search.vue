<template>
  <div class="_page">
    <div class="_container">
      <div class="search-header">
        <h2 class="_h2">Результати пошуку</h2>
        <div v-if="activeFilters.length" class="active-filters _flex _flex-wrap _gap-8">
          <span v-for="f in activeFilters" :key="f" class="active-filter-badge">{{ f }}</span>
        </div>
      </div>

      <div v-if="isLoading" class="loading-state">Завантаження...</div>
      <div v-else-if="errorMessage" class="error-state">{{ errorMessage }}</div>
      <div v-else-if="stories.length === 0" class="empty-state">За вашим запитом нічого не знайдено.</div>
      <div v-else class="stories-grid">
        <div v-for="story in stories" :key="story.id">
          <Card :story="story" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import Card from "../components/Card.vue";
import { api } from '../utils/api';

interface Story {
  id: number;
  title: string;
  author: string;
  description: string;
  rating: number;
  created_at: string;
  cover: string;
  genres: string[];
  ownerId?: number;
}

const STATUS_LABELS: Record<string, string> = {
  in_progress: 'В процесі',
  completed: 'Завершено',
  frozen: 'Заморожено',
};

const LANGUAGE_LABELS: Record<string, string> = {
  uk: 'Українська',
  ru: 'Русский',
  en: 'English',
  de: 'Deutsch',
  fr: 'Français',
  es: 'Español',
};

const route = useRoute();
const stories = ref<Story[]>([]);
const isLoading = ref(true);
const errorMessage = ref("");

const activeFilters = computed(() => {
  const result: string[] = [];
  const q = route.query.q as string | undefined;
  const genres = route.query.genres as string | undefined;
  const tags = route.query.tags as string | undefined;
  const status = route.query.status as string | undefined;
  const language = route.query.language as string | undefined;

  if (q) result.push(`"${q}"`);
  if (genres) genres.split(',').forEach(g => result.push(g));
  if (tags) tags.split(',').forEach(t => result.push(`#${t.trim()}`));
  if (status && STATUS_LABELS[status]) result.push(STATUS_LABELS[status]);
  if (language && LANGUAGE_LABELS[language]) result.push(LANGUAGE_LABELS[language]);
  return result;
});

const loadStories = async () => {
  isLoading.value = true;
  errorMessage.value = "";

  try {
    const params = new URLSearchParams();
    const q = route.query.q as string | undefined;
    const genres = route.query.genres as string | undefined;
    const tags = route.query.tags as string | undefined;
    const status = route.query.status as string | undefined;
    const language = route.query.language as string | undefined;

    if (q) params.append('query', q);
    if (genres) params.append('genres', genres);
    if (tags) params.append('tags', tags);
    if (status) params.append('status', status);
    if (language) params.append('language', language);

    const data = await api.get(`/stories?${params.toString()}`);
    stories.value = data.map((story: any) => ({
      ...story,
      created_at: story.createdAt ?? story.created_at,
    }));
  } catch (error) {
    console.error("Failed to load stories:", error);
    errorMessage.value = "Не вдалося завантажити історії. Спробуйте пізніше.";
    stories.value = [];
  } finally {
    isLoading.value = false;
  }
};

onMounted(loadStories);
watch(() => route.query, loadStories, { deep: true });
</script>

<style scoped>
.search-header {
  margin-bottom: 24px;
}
.search-header h2 {
  margin-bottom: 12px;
}
.active-filter-badge {
  display: inline-block;
  padding: 4px 12px;
  background: #e7f3ff;
  color: var(--color-primary);
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
}
</style>
