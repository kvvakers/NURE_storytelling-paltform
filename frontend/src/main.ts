import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'
import { useUserStore } from './stores/user'
import VueApexCharts from 'vue3-apexcharts'

const pinia = createPinia();
const app = createApp(App).use(router).use(pinia).use(VueApexCharts);

const userStore = useUserStore();
await userStore.loadAuth();

app.mount('#app')
