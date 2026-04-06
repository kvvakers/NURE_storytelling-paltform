<template>
  <div class="home">
    <div class="_container">
      <section class="hero">
        <h1 class="_h1">Платформа історій</h1>
        <p class="_p">Читайте, публікуйте та діліться своїми історіями</p>
        <div class="hero-buttons">
          <button class="btn btn-primary">Почати читати</button>
          <RouterLink :to="{ name: RouteName.CREATE_STORY }" class="btn btn-secondary">
            Опублікувати історію
          </RouterLink>
        </div>
      </section>

      <section class="section">
        <h2 class="_h2">Популярне</h2>
        <div v-if="isLoading" class="loading-state">Завантаження історій...</div>
        <div v-if="errorMessage" class="error-state">{{ errorMessage }}</div>
        <div v-if="!isLoading && stories.length === 0" class="loading-state">Поки немає доступних історій.</div>
        <swiper
          v-if="stories.length > 0"
          :slides-per-view="7"
          :space-between="20"
          :loop="true"
          navigation
          class="stories-swiper swiper-fade"
        >
          <swiper-slide v-for="story in popularStoriesRef" :key="story.id">
            <div class="story-card">
              <RouterLink :to="{name: RouteName.STORY, params: {id: story.id}}">
                <img :src="story.cover" alt="cover" />
                <div class="story-card-info">
                  <h3>{{ story.title }}</h3>
                  <p>{{ story.author || 'Автор не вказаний' }}</p>
                  <p>{{ new Date(story.created_at).toLocaleDateString() }}</p>
                </div>
              </RouterLink>
            </div>
          </swiper-slide>
        </swiper>
      </section>

      <section v-if="stories.length > 0" class="section">
        <h2 class="_h2">Нові історії</h2>
        <swiper
          :slides-per-view="7"
          :space-between="20"
          :loop="true"
          navigation
          class="stories-swiper swiper-fade"
        >
          <swiper-slide v-for="story in newStories" :key="story.id">
            <div class="story-card">
              <RouterLink :to="{name: RouteName.STORY, params: {id: story.id}}">
                <img :src="story.cover" alt="cover" />
                <div class="story-card-info">
                  <h3>{{ story.title }}</h3>
                  <p>{{ story.author || 'Автор не вказаний' }}</p>
                  <p>{{ new Date(story.created_at).toLocaleDateString('uk-UA') }}</p>
                </div>
              </RouterLink>
            </div>
          </swiper-slide>
        </swiper>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

import { Swiper, SwiperSlide } from "swiper/vue";
import "swiper/css";
import "swiper/css/navigation";
import { Navigation } from "swiper/modules";
import SwiperCore from "swiper";
import { RouteName } from "../router/keys";
SwiperCore.use([Navigation]);

interface Story {
  id: number;
  title: string;
  cover: string;
  rating: number;
  created_at: string;
  author?: string;
}

const stories = ref<Story[]>([]);
const isLoading = ref(true);
const errorMessage = ref<string | null>(null);

const popularStoriesRef = computed(() => {
  return stories.value.filter((s) => s.rating > 6).slice(0, 10);
});

const newStories = computed(() => {
  return [...stories.value]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10);
});

onMounted(async () => {
  try {
    const response = await fetch("http://localhost:3000/stories");
    if (!response.ok) {
      throw new Error("Backend response not OK");
    }

    const data = await response.json();
    stories.value = data.map((story: any) => ({
      ...story,
      created_at: story.createdAt,
    }));
  } catch (error) {
    console.error("Failed to load stories from backend:", error);
    errorMessage.value = "Не вдалося завантажити історії з бази. Повторіть спробу пізніше.";
    stories.value = [];
  } finally {
    isLoading.value = false;
  }
});
</script>

<style scoped>
.hero {
  text-align: center;
  padding: 32px 0;
}

.hero p {
  font-size: 18px;
  color: #666;
  margin-bottom: 20px;
}

.hero-buttons button {
  margin: 0 10px;
  padding: 10px 18px;
  border-radius: 8px;
  cursor: pointer;
}

.secondary {
  background: #e5e7eb;
}

.section {
  margin-bottom: 40px;
}

.section h2 {
  margin-bottom: 15px;
}

.stories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
}

.story-card {
  background: white;
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.story-card img {
  width: 100%;
  border-radius: 8px;
  margin-bottom: 10px;
}

.story-card-info {
  padding: 10px 0;
}

.story-card-info h3 {
  margin: 0 0 6px;
  font-size: 1rem;
  color: #111;
}

.story-card-info p {
  margin: 2px 0;
  color: #666;
  font-size: 0.9rem;
}

.loading-state,
.error-state {
  padding: 16px 0;
  font-size: 1rem;
  text-align: center;
}

.error-state {
  color: #b91c1c;
}
.swiper-fade {
  position: relative;
}

.swiper-fade::before,
.swiper-fade::after {
  content: "";
  position: absolute;
  top: 0;
  width: 120px;
  height: 100%;
  z-index: 2;
  pointer-events: none;
}

.swiper-fade::before {
  left: 0;
  background: linear-gradient(to right, #fff, transparent);
}

.swiper-fade::after {
  right: 0;
  background: linear-gradient(to left, #fff, transparent);
}
</style>
