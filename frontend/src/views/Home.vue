<template>
  <div class="home">
    <div class="_container">
      <!-- Hero блок -->
      <section class="hero">
        <h1 class="_h1">Платформа историй</h1>
        <p class="_p">Читайте, публикуйте и делитесь своими историями</p>
        <div class="hero-buttons">
          <button class="primary">Начать читать</button>
          <button class="secondary">Опубликовать историю</button>
        </div>
      </section>

      <!-- Популярные истории -->
      <section class="section">
        <h2 class="_h2">Популярное</h2>
        <swiper
          :slides-per-view="7"
          :space-between="20"
          :loop="true"
          navigation
          class="stories-swiper"
        >
          <swiper-slide v-for="story in popularStoriesRef" :key="story.id">
            <div class="story-card">
              <img :src="story.cover" alt="cover" />
            </div>
          </swiper-slide>
        </swiper>
      </section>

      <!-- Новые истории -->
      <section class="section">
        <h2 class="_h2">Новые истории</h2>
        <swiper
          :slides-per-view="7"
          :space-between="20"
          :loop="true"
          navigation
          class="stories-swiper"
        >
          <swiper-slide v-for="story in newStories" :key="story.id">
            <div class="story-card">
              <img :src="story.cover" alt="cover" />
            </div>
          </swiper-slide>
        </swiper>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { data as stories } from "../mock/stories";

import { Swiper, SwiperSlide } from "swiper/vue";
import "swiper/css";
import "swiper/css/navigation";
import { Navigation } from "swiper/modules";
import SwiperCore from "swiper";
SwiperCore.use([Navigation]);

const popularStoriesRef = ref(
  JSON.parse(JSON.stringify(stories.filter((s) => s.rating > 6).slice(0, 10))),
);

const newStories = ref(
  JSON.parse(JSON.stringify(stories))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 10),
);
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
  border: none;
  cursor: pointer;
}

.primary {
  background: #4f46e5;
  color: white;
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

.story-card h3 {
  margin: 5px 0;
}

.author {
  font-size: 13px;
  color: #888;
}

.description {
  font-size: 14px;
  color: #555;
}

</style>
