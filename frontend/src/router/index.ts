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
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
