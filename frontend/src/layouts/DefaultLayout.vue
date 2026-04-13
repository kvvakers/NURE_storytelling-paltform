<template>
    <div class="default-layout _flex _flex-col _flex-full">
        <DefaultHeader />
        <main class="main-content _flex-full _flex _flex-col">
            <slot />
        </main>
    </div>
</template>

<script setup>
import DefaultHeader from '../components/DefaultHeader.vue'
</script>

<style scoped>
</style>