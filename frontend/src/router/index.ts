import { createRouter, createWebHistory } from "vue-router";
import { RouteName } from "./keys";

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
    path: "/profile/:nickname",
    name: RouteName.PROFILE,
    component: () => import("../views/Profile.vue"),
  },
  {
    path: "/create-story",
    name: RouteName.CREATE_STORY,
    component: () => import("../views/CreateStory.vue"),
  },
  {
    path: "/write-chapter",
    name: RouteName.WRITE_CHAPTER,
    component: () => import("../views/WriteChapter.vue"),
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

export default router;
