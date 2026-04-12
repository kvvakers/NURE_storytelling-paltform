<template>
  <div class="stories">
    <div v-for="story in stories" :key="story.id">
      <Card :story="story"/>
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
}

const API_BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");
const route = useRoute();
const stories = ref<Story[]>([]);
const isLoading = ref(true);
const errorMessage = ref("");

const searchQuery = computed(() => (route.params.query as string) || "");

const loadStories = async () => {
  isLoading.value = true;
  errorMessage.value = "";

  try {
    const url = new URL(`${API_BASE}/stories`);
    if (searchQuery.value) {
      url.searchParams.append("query", searchQuery.value);
    }

    const data = await api.get(`/stories?${url.searchParams.toString()}`);
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
watch(() => route.params.query, loadStories);
</script>

<style scoped>
.stories {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
  padding: 30px;
}
</style>
