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
        <h2 class="_h2">Нові історії</h2>
        <div v-if="isLoading" class="loading-state">Завантаження історій...</div>
        <div v-if="errorMessage" class="error-state">{{ errorMessage }}</div>
        <div v-if="!isLoading && newStories.length === 0 && !errorMessage" class="loading-state">Поки немає доступних історій.</div>
        <swiper
          v-if="newStories.length > 0"
          :slides-per-view="7"
          :space-between="20"
          :loop="newStories.length >= 7"
          navigation
          class="stories-swiper swiper-fade"
        >
          <swiper-slide v-for="story in newStories" :key="story.id">
            <div class="story-card panel _flex _flex-col">
              <RouterLink :to="{name: RouteName.STORY, params: {id: story.id}}">
                <img :src="resolveMedia(story.cover) || 'src/assets/placeholder.jpg'" alt="cover" class="_shrink-0" />
                <div class="story-card-info">
                  <h3>{{ story.title }}</h3>
                  <p>{{ story.author || 'Автор не вказаний' }}</p>
                  <p>{{ new Date(story.createdAt).toLocaleDateString('uk-UA') }}</p>
                </div>
              </RouterLink>
            </div>
          </swiper-slide>
        </swiper>
      </section>

      <section class="section">
        <h2 class="_h2">Популярне</h2>
        <div v-if="isLoading" class="loading-state">Завантаження...</div>
        <div v-if="!isLoading && popularStories.length === 0 && !errorMessage" class="loading-state">Немає популярних за останні 2 тижні.</div>
        <swiper
          v-if="popularStories.length > 0"
          :slides-per-view="7"
          :space-between="20"
          :loop="popularStories.length >= 7"
          navigation
          class="stories-swiper swiper-fade"
        >
          <swiper-slide v-for="story in popularStories" :key="story.id">
            <div class="story-card panel _flex _flex-col">
              <RouterLink :to="{name: RouteName.STORY, params: {id: story.id}}">
                <img :src="resolveMedia(story.cover) || 'src/assets/placeholder.jpg'" alt="cover" />
                <div class="story-card-info">
                  <h3>{{ story.title }}</h3>
                  <p>{{ story.author || 'Автор не вказаний' }}</p>
                  <p>{{ new Date(story.createdAt).toLocaleDateString('uk-UA') }}</p>
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
import { onMounted, ref } from "vue";

import { Swiper, SwiperSlide } from "swiper/vue";
import "swiper/css";
import "swiper/css/navigation";
import { Navigation } from "swiper/modules";
import SwiperCore from "swiper";
import { RouteName } from "../router/keys";
import { api } from '../utils/api';
import { resolveMedia } from '../utils/resolveMedia';
SwiperCore.use([Navigation]);

interface Story {
  id: number;
  title: string;
  cover: string;
  rating: number;
  createdAt: string;
  author?: string;
}

const newStories = ref<Story[]>([]);
const popularStories = ref<Story[]>([]);
const isLoading = ref(true);
const errorMessage = ref<string | null>(null);

onMounted(async () => {
  try {
    const [newData, popularData] = await Promise.all([
      api.get('/stories/new'),
      api.get('/stories/popular'),
    ]);
    newStories.value = newData;
    popularStories.value = popularData;
  } catch (error) {
    console.error("Failed to load stories from backend:", error);
    errorMessage.value = "Не вдалося завантажити історії з бази. Повторіть спробу пізніше.";
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
  color: var(--color-text-muted);
  margin-bottom: 20px;
}

.hero-buttons button {
  margin: 0 10px;
}

.section {
  margin-bottom: 40px;
}

.section h2 {
  margin-bottom: 15px;
}

.story-card {
  padding: 12px;
}

.story-card img {
  width: 100%;
  height: 180px;
  object-fit: cover;
  border-radius: 8px;
  margin-bottom: 10px;
}

.story-card-info { padding: 10px 0; }
.story-card-info h3 { margin: 0 0 6px; font-size: 1rem; color: #111; }
.story-card-info p { margin: 2px 0; color: var(--color-text-muted); font-size: 0.9rem; }

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
