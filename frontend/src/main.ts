import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'
import { useUserStore } from './stores/user'

const pinia = createPinia();
const app = createApp(App).use(router).use(pinia);

const userStore = useUserStore();
userStore.loadAuth();

app.mount('#app')
