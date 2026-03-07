<template>
  <RouterLink :to="{ name: RouteName.STORY, params: { id: story.id } }" class="card">
    <img :src="story.cover" :alt="story.title" class="cover" />

    <div class="info">
      <h2 class="title">{{ story.title }}</h2>

      <div class="meta">
        <span><b>Автор:</b> {{ story.author }}</span>
        <span><b>Рейтинг:</b> {{ story.rating }}/10</span>
        <span><b>Дата:</b> {{ formatDate(story.created_at) }}</span>
      </div>

      <p class="description">
        {{ story.description }}
      </p>

      <div class="genres">
        <span v-for="genre in story.genres" :key="genre" class="genre">
          {{ genre }}
        </span>
      </div>
    </div>
  </RouterLink>
</template>

<script setup>
import { RouteName } from "../router/keys";
import { formatDate } from "../utils/formatDate";

defineProps({
  story: {
    type: Object,
    required: true,
  },
});
</script>

<style scoped>
.card {
  background: #fff;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  border: 1px solid transparent;
  cursor: pointer;
}
.card:hover {
  box-shadow: 0 12px 30px rgba(0, 123, 255, 0.1);
}

.cover {
  width: 100%;
  height: 250px;
  object-fit: cover;
}

.info {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.title {
  margin: 0;
}

.meta {
  font-size: 13px;
  color: #666;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.description {
  font-size: 14px;
}

.genres {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: auto;
}

.genre {
  background: #f2f2f2;
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 12px;
}
</style>
