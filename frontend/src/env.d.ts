/// <reference types="vite/client" />

declare module '@vue/runtime-core' {
  interface GlobalComponents {
    apexchart: typeof import('vue3-apexcharts')['default']
  }
}

declare module '*.vue' {
  import { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

// Allow importing CSS files (and specific swiper CSS paths) in TypeScript
declare module '*.css'
declare module 'swiper/css'
declare module 'swiper/css/navigation'

// Image assets
declare module '*.jpg' {
  const src: string
  export default src
}
declare module '*.jpeg' {
  const src: string
  export default src
}
declare module '*.png' {
  const src: string
  export default src
}
declare module '*.webp' {
  const src: string
  export default src
}
declare module '*.svg' {
  const src: string
  export default src
}