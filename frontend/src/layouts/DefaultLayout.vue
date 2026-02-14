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