<template>
  <RouterLink :to="{ name: RouteName.STORY, params: { id: story.id } }" class="card _flex _flex-col">
    <img :src="resolveMedia(story.cover)" :alt="story.title" class="cover" />

    <div class="info _flex _flex-col _gap-10">
      <h2 class="title">{{ story.title }}</h2>

      <div class="meta _flex _flex-wrap _gap-10">
        <span class="_flex _ai-c _gap-4">
          <User :size="13" />
          <span
            :class="{ 'author-link': story.ownerId }"
            @click.prevent.stop="story.ownerId && router.push({ name: RouteName.PROFILE, params: { id: story.ownerId } })"
          >{{ story.author }}</span>
        </span>
        <span class="_flex _ai-c _gap-4"><Star :size="13" /> {{ story.rating }}/10</span>
        <span class="_flex _ai-c _gap-4"><Calendar :size="13" /> {{ formatDate(story.created_at) }}</span>
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
import { User, Star, Calendar } from "lucide-vue-next";

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
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
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
  color: var(--color-text-muted);
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
