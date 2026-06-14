import { createRouter, createWebHistory } from "vue-router";
import { RouteName } from "./keys";
import { useUserStore } from "../stores/user";

const routes = [
  {
    path: "/",
    name: RouteName.HOME,
    component: () => import("../views/Home.vue"),
  },
  {
    path: "/search",
    name: RouteName.SEARCH,
    component: () => import("../views/Search.vue"),
  },
  {
    path: "/story/:id",
    name: RouteName.STORY,
    component: () => import("../views/Story.vue"),
  },
  {
    path: "/story/:id/chapter/:chapterIndex",
    name: RouteName.READ_CHAPTER,
    component: () => import("../views/ReadChapter.vue"),
  },
  {
    path: "/profile",
    name: RouteName.MY_PROFILE,
    component: () => import("../views/Profile.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/profile/:id",
    name: RouteName.PROFILE,
    component: () => import("../views/Profile.vue"),
  },
  {
    path: "/create-story",
    name: RouteName.CREATE_STORY,
    component: () => import("../views/CreateStory.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/story/:id/edit",
    name: RouteName.EDIT_STORY,
    component: () => import("../views/EditStory.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/write-chapter/:storyId?/:chapterIndex?",
    name: RouteName.WRITE_CHAPTER,
    component: () => import("../views/WriteChapter.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/login",
    name: RouteName.LOGIN,
    component: () => import("../views/Login.vue"),
  },
  {
    path: "/register",
    name: RouteName.REGISTER,
    component: () => import("../views/Register.vue"),
  },
  {
    path: "/notifications",
    name: RouteName.NOTIFICATIONS,
    component: () => import("../views/Notifications.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/story/:id/statistics",
    name: RouteName.STORY_STATISTICS,
    component: () => import("../views/Statistics.vue"),
    meta: { requiresAuth: true },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to) => {
  if (to.meta.requiresAuth) {
    const userStore = useUserStore();
    if (!userStore.isAuthorized) {
      return { name: RouteName.LOGIN };
    }
  }
});

export default router;
