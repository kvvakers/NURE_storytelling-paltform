<template>
  <div class="stories">
    <div v-for="story in stories" :key="story.id">
      <Card :story="story"/>
    </div>
  </div>
</template>

<script setup>
import { useRoute } from "vue-router";
import { data as stories } from "../mock/stories";
import Card from "../components/Card.vue";

const route = useRoute();
console.log(route.params);
</script>

<style scoped>
.stories {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
  padding: 30px;
}
</style>
