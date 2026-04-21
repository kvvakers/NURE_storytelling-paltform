<template>
  <RouterLink :to="{ name: RouteName.STORY, params: { id: story.id } }" class="card _flex _flex-col">
    <img :src="resolveMedia(story.cover)" :alt="story.title" class="cover" />

    <div class="info _flex _flex-col _gap-10">
      <h2 class="title">{{ story.title }}</h2>

      <div class="meta _flex _flex-wrap _gap-10">
        <span>
          <b>Автор:</b>
          <span
            :class="{ 'author-link': story.ownerId }"
            @click.prevent.stop="story.ownerId && router.push({ name: RouteName.PROFILE, params: { id: story.ownerId } })"
          >{{ story.author }}</span>
        </span>
        <span><b>Рейтинг:</b> {{ story.rating }}/10</span>
        <span><b>Дата:</b> {{ formatDate(story.created_at) }}</span>
      </div>

      <p class="description">
        {{ story.description }}
      </p>

      <div class="genres _flex _flex-wrap _gap-8">
        <span v-for="genre in story.genres" :key="genre" class="genre">
          {{ genre }}
        </span>
      </div>
    </div>
  </RouterLink>
</template>

<script setup>
import { useRouter } from "vue-router";
import { RouteName } from "../router/keys";
import { formatDate } from "../utils/formatDate";
import { resolveMedia } from "../utils/resolveMedia";

const router = useRouter();

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
}
.title {
  margin: 0;
}
.meta {
  font-size: 13px;
  color: #666;
}
.author-link {
  color: var(--color-primary);
  cursor: pointer;
  text-decoration: underline;
}
.author-link:hover {
  opacity: 0.8;
}
.description {
  font-size: 14px;
}
.genres {
  margin-top: auto;
}
.genre {
  background: #f2f2f2;
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 12px;
}
</style>
