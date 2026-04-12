<template>
  <teleport to="body">
    <div class="toast-container">
      <transition-group name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="toast"
          :class="`toast--${toast.type}`"
          @click="remove(toast.id)"
        >
          <span class="toast__icon">{{ icons[toast.type] }}</span>
          <span class="toast__message">{{ toast.message }}</span>
          <button class="toast__close" @click.stop="remove(toast.id)">✕</button>
        </div>
      </transition-group>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { useToast } from '../composables/useToast';

const { toasts, remove } = useToast();

const icons: Record<string, string> = {
  success: '✓',
  error: '✗',
  warning: '⚠',
  info: 'ℹ',
};
</script>

<style scoped>
.toast-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: none;
}

.toast {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 280px;
  max-width: 420px;
  padding: 14px 16px;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.18);
  font-size: 0.95rem;
  cursor: pointer;
  pointer-events: all;
  color: #fff;
}

.toast--success { background-color: #28a745; }
.toast--error   { background-color: #dc3545; }
.toast--warning { background-color: #fd7e14; color: #fff; }
.toast--info    { background-color: #007bff; }

.toast__icon {
  font-size: 1.1rem;
  flex-shrink: 0;
}

.toast__message {
  flex: 1;
}

.toast__close {
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  font-size: 0.9rem;
  opacity: 0.8;
  padding: 0;
  line-height: 1;
  flex-shrink: 0;
}

.toast__close:hover {
  opacity: 1;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(40px);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(40px);
}
</style>
