<template>
  <div v-if="story" class="story _flex _gap-x-32">
    <div>
      <img :src="story.cover" :alt="story.title" class="cover" />
    </div>

    <div>
      <h1>{{ story.title }}</h1>
      <p><b>Автор:</b> {{ story.author }}</p>
      <p><b>Описание:</b> {{ story.description }}</p>
      <p><b>Рейтинг:</b> {{ story.rating }}</p>
      <p><b>Дата:</b> {{ new Date(story.created_at).toLocaleDateString() }}</p>

      <div class="genres">
        <span v-for="g in story.genres" :key="g" class="genre">
          {{ g }}
        </span>
      </div>
    </div>
  </div>

  <div v-else>История не найдена</div>
</template>

<script setup>
import { useRoute } from "vue-router";
import { data as stories } from "../mock/stories";
import { computed } from "vue";

const route = useRoute();

const story = computed(() => {
  const id = Number(route.params.id);
  return stories.find((s) => s.id === id);
});
</script>

<style scoped>
.story {
  max-width: 800px;
  margin: 0 auto;
}

.cover {
  width: 300px;
  border-radius: 12px;
}

.genre {
  margin-right: 8px;
  padding: 4px 8px;
  background: #eee;
  border-radius: 6px;
}
</style>
