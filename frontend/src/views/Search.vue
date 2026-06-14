<template>
  <div class="_page">
    <div class="_container">
      <div class="search-header">
        <h2 class="_h2">Результати пошуку</h2>
        <div v-if="activeFilters.length" class="active-filters _flex _flex-wrap _gap-8">
          <span v-for="f in activeFilters" :key="f.label" class="active-filter-badge _flex _ai-c _gap-4">
            {{ f.label }}
            <button class="filter-badge-remove" @click="removeFilter(f.key, f.value)" :title="`Видалити фільтр ${f.label}`">
              <X :size="12" />
            </button>
          </span>
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
import { useRoute, useRouter } from "vue-router";
import { X } from "lucide-vue-next";
import Card from "../components/Card.vue";
import { api } from '../utils/api';
import { RouteName } from '../router/keys';

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

interface FilterItem {
  label: string;
  key: string;
  value?: string;
}

const route = useRoute();
const router = useRouter();
const stories = ref<Story[]>([]);
const isLoading = ref(true);
const errorMessage = ref("");

const activeFilters = computed<FilterItem[]>(() => {
  const result: FilterItem[] = [];
  const q = route.query.q as string | undefined;
  const genres = route.query.genres as string | undefined;
  const tags = route.query.tags as string | undefined;
  const status = route.query.status as string | undefined;
  const language = route.query.language as string | undefined;

  if (q) result.push({ label: `"${q}"`, key: 'q' });
  if (genres) genres.split(',').forEach(g => result.push({ label: g, key: 'genres', value: g }));
  if (tags) tags.split(',').forEach(t => result.push({ label: `#${t.trim()}`, key: 'tags', value: t.trim() }));
  if (status && STATUS_LABELS[status]) result.push({ label: STATUS_LABELS[status], key: 'status' });
  if (language && LANGUAGE_LABELS[language]) result.push({ label: LANGUAGE_LABELS[language], key: 'language' });
  return result;
});

const removeFilter = (key: string, value?: string) => {
  const query = { ...route.query };
  if ((key === 'genres' || key === 'tags') && value) {
    const parts = (query[key] as string).split(',').map(s => s.trim()).filter(s => s !== value);
    if (parts.length) query[key] = parts.join(',');
    else delete query[key];
  } else {
    delete query[key];
  }
  router.push({ name: RouteName.SEARCH, query });
};

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
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px 4px 12px;
  background: #e7f3ff;
  color: var(--color-primary);
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
}

.filter-badge-remove {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-primary);
  padding: 0;
  display: flex;
  align-items: center;
  border-radius: 50%;
  opacity: 0.6;
  transition: opacity 0.15s;
  line-height: 1;
}
.filter-badge-remove:hover {
  opacity: 1;
}

@media (max-width: 768px) {
  .search-header {
    margin-bottom: 16px;
  }
}
</style>
