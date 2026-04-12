import { ref } from 'vue';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

const toasts = ref<Toast[]>([]);
let nextId = 0;

export function useToast() {
  function show(message: string, type: ToastType = 'info', duration = 3500) {
    const id = ++nextId;
    toasts.value.push({ id, message, type });
    setTimeout(() => remove(id), duration);
  }

  function remove(id: number) {
    toasts.value = toasts.value.filter(t => t.id !== id);
  }

  return { toasts, show, remove };
}
