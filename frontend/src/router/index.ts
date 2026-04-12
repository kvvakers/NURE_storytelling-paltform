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
    path: "/search/:query",
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
    path: "/profile/:nickname",
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
    path: "/write-chapter",
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
