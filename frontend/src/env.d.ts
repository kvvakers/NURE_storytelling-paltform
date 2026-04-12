/// <reference types="vite/client" />

declare module '*.vue' {
  import { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

// Allow importing CSS files (and specific swiper CSS paths) in TypeScript
declare module '*.css'
declare module 'swiper/css'
declare module 'swiper/css/navigation'