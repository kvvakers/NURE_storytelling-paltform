<template>
  <Teleport to="body">
    <transition name="filter-slide">
      <div v-if="modelValue" class="filter-sidebar-wrap">
        <div class="filter-backdrop" @click="$emit('update:modelValue', false)" />
        <div class="filter-panel">
          <div class="filter-panel__header">
            <span class="filter-panel__title">Фільтри</span>
            <button class="filter-panel__close" @click="$emit('update:modelValue', false)">
              <X :size="18" />
            </button>
          </div>

          <div class="filter-panel__body">
            <div class="filter-section">
              <div class="filter-section__label">Жанри</div>
              <div class="filter-genres">
                <label v-for="genre in GENRES" :key="genre" class="filter-check">
                  <input type="checkbox" v-model="selectedGenres" :value="genre" class="filter-check__input" />
                  <span class="filter-check__text">{{ genre }}</span>
                </label>
              </div>
            </div>

            <div class="filter-section">
              <div class="filter-section__label">Теги (через кому)</div>
              <input
                v-model="tagsInput"
                type="text"
                placeholder="магія, дракони, пригоди..."
                class="filter-input form-input"
              />
            </div>

            <div class="filter-section">
              <div class="filter-section__label">Статус</div>
              <select v-model="selectedStatus" class="filter-select form-input">
                <option value="">Усі</option>
                <option value="in_progress">В процесі</option>
                <option value="completed">Завершено</option>
                <option value="frozen">Заморожено</option>
              </select>
            </div>

            <div class="filter-section">
              <div class="filter-section__label">Мова</div>
              <select v-model="selectedLanguage" class="filter-select form-input">
                <option value="">Усі</option>
                <option value="uk">Українська</option>
                <option value="ru">Русский</option>
                <option value="en">English</option>
                <option value="de">Deutsch</option>
                <option value="fr">Français</option>
                <option value="es">Español</option>
              </select>
            </div>
          </div>

          <div class="filter-panel__footer">
            <button class="btn btn-secondary" @click="clearFilters">Очистити</button>
            <button class="btn btn-primary" @click="applySearch">Пошук</button>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { X } from 'lucide-vue-next';
import { RouteName } from '../router/keys';

const props = defineProps<{
  modelValue: boolean;
  searchQuery?: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
}>();

const router = useRouter();

const GENRES = [
  'Драма', 'Романтика', 'Фантастика', 'Тайна', 'Приключение',
  'Научная фантастика', 'Ужас', 'Комедия', 'Детектив', 'История',
];

const selectedGenres = ref<string[]>([]);
const tagsInput = ref('');
const selectedStatus = ref('');
const selectedLanguage = ref('');

const clearFilters = () => {
  selectedGenres.value = [];
  tagsInput.value = '';
  selectedStatus.value = '';
  selectedLanguage.value = '';
};

const applySearch = () => {
  const query: Record<string, string> = {};
  if (props.searchQuery?.trim()) query.q = props.searchQuery.trim();
  if (selectedGenres.value.length) query.genres = selectedGenres.value.join(',');
  if (tagsInput.value.trim()) query.tags = tagsInput.value.trim();
  if (selectedStatus.value) query.status = selectedStatus.value;
  if (selectedLanguage.value) query.language = selectedLanguage.value;

  router.push({ name: RouteName.SEARCH, query });
  emit('update:modelValue', false);
};
</script>

<style scoped>
.filter-sidebar-wrap {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  justify-content: flex-end;
}

.filter-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
}

.filter-panel {
  position: relative;
  width: 320px;
  max-width: 90vw;
  background: var(--color-surface);
  box-shadow: var(--shadow-md);
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.filter-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.25rem 1rem;
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}

.filter-panel__title {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-text);
}

.filter-panel__close {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text-muted);
  padding: 4px;
  display: flex;
  align-items: center;
  border-radius: 4px;
  transition: background 0.2s;
}
.filter-panel__close:hover {
  background: #f0f0f0;
  color: var(--color-text);
}

.filter-panel__body {
  flex: 1;
  overflow-y: auto;
  padding: 1rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.filter-section__label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.filter-genres {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.filter-check {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  padding: 4px 10px;
  border: 1px solid var(--color-border);
  border-radius: 20px;
  font-size: 0.85rem;
  transition: border-color 0.2s, background 0.2s;
  user-select: none;
}
.filter-check:hover {
  border-color: var(--color-primary);
  background: #f0f7ff;
}
.filter-check__input {
  display: none;
}
.filter-check:has(.filter-check__input:checked) {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

.filter-input,
.filter-select {
  width: 100%;
  box-sizing: border-box;
}

.filter-panel__footer {
  display: flex;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  border-top: 1px solid var(--color-border);
  flex-shrink: 0;
}
.filter-panel__footer .btn {
  flex: 1;
}

/* Slide-in transition */
.filter-slide-enter-active,
.filter-slide-leave-active {
  transition: opacity 0.25s ease;
}
.filter-slide-enter-active .filter-panel,
.filter-slide-leave-active .filter-panel {
  transition: transform 0.25s ease;
}
.filter-slide-enter-from,
.filter-slide-leave-to {
  opacity: 0;
}
.filter-slide-enter-from .filter-panel,
.filter-slide-leave-to .filter-panel {
  transform: translateX(100%);
}
</style>
