<template>
  <div class="profile-page">
    <header class="profile-header">
      <div class="profile-main">
        <img :src="user.avatar" :alt="user.nickname" class="profile-avatar" />
        
        <div class="profile-info">
          <div class="profile-title">
            <h1 class="nickname">{{ user.nickname }}</h1>
            <button v-if="isCurrentUser" class="btn btn-secondary">Редагувати профіль</button>
            <button v-else class="btn btn-primary">Підписатися +</button>
          </div>

          <div class="stats">
            <div class="stat-item"><b>{{ user.storiesCount }}</b> праць</div>
            <div class="stat-item"><b>{{ user.followers }}</b> підписчиків</div>
            <div class="stat-item"><b>{{ user.following }}</b> підписок</div>
          </div>

          <div class="bio">
            <p>{{ user.bio }}</p>
            <span class="reg-date">З саме {{ formatDate(user.registered_at) }}</span>
          </div>
        </div>
      </div>
    </header>

    <hr class="divider" />

    <section class="user-stories">
      <h3 class="section-title">Праці автора</h3>
      
      <div class="stories-grid">
        <div v-for="story in authorStories" :key="story.id" class="card">
         <Card :story="story"/>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { formatDate } from "../utils/formatDate";
import { RouteName } from "../router/keys";
import Card from "../components/Card.vue";
import { useRoute } from "vue-router";

const user = {
  nickname: "Writer_Master",
  avatar: "https://via.placeholder.com/150",
  followers: 1250,
  following: 430,
  storiesCount: 5,
  bio: "Пишу фэнтези и антиутопии. Люблю кофе и сложные сюжетные повороты. Добро пожаловать в мои миры!",
  registered_at: "2023-10-15T12:00:00Z"
};

const authorStories = computed(() => [].slice(0, 5));

const route = useRoute();
console.log(route.params);

const isCurrentUser = computed(() => {
  return true;
});
</script>

<style scoped>
.profile-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
}

/* Стили шапки */
.profile-header {
  margin-bottom: 40px;
}

.profile-main {
  display: flex;
  gap: 40px;
  align-items: flex-start;
}

.profile-avatar {
  width: 180px;
  height: 180px;
  border-radius: 50%;
  object-fit: cover;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.profile-info {
  flex: 1;
}

.profile-title {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
}

.nickname {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
}

.edit-btn {
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid #ddd;
  background: #fff;
  cursor: pointer;
  font-size: 14px;
  transition: 0.2s;
}

.edit-btn:hover {
  background: #f8f8f8;
  border-color: #bbb;
}

.stats {
  display: flex;
  gap: 30px;
  margin-bottom: 20px;
}

.stat-item {
  font-size: 16px;
}

.bio {
  line-height: 1.6;
  color: #444;
}

.reg-date {
  display: block;
  margin-top: 10px;
  font-size: 13px;
  color: #888;
}

.divider {
  border: 0;
  border-top: 1px solid #eee;
  margin: 40px 0;
}

.section-title {
  margin-bottom: 24px;
  font-size: 20px;
}

/* Сетка карточек (аналогично твоей) */
.stories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
}
</style>