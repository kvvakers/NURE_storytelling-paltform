<template>
    <default-layout>
        <router-view />
    </default-layout>
    <toast-notification />
</template>


<script setup>
import DefaultLayout from './layouts/DefaultLayout.vue';
import ToastNotification from './components/ToastNotification.vue';
</script>