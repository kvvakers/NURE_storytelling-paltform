<template>
    <div class="default-layout">
        <DefaultHeader />
        <main class="main-content">
            <slot />
        </main>
    </div>
</template>

<script setup>
import DefaultHeader from '../components/DefaultHeader.vue'
</script>

<style scoped>
.default-layout {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
}

.main-content {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
}
</style>