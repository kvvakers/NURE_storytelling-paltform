<template>
  <div class="create-story _page">
    <div class="_container">
      <h1 class="_h1">Створити історію</h1>
      
      <form @submit.prevent="submitStory" class="form panel">
        <!-- Cover Image -->
        <div class="form-group">
          <label for="cover">Обкладинка</label>
          <div class="image-upload">
            <div v-if="isUploadingCover" class="upload-placeholder _flex _flex-col _ai-c _jc-c">
              <p>Завантаження...</p>
            </div>
            <div v-else-if="previewImage" class="image-preview">
              <img :src="previewImage" :alt="formData.title || 'Preview'" />
              <button type="button" @click="removeCover" class="btn-remove _flex _ai-c _jc-c">✕</button>
            </div>
            <div v-else class="upload-placeholder _flex _flex-col _ai-c _jc-c">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
              <p>Завантажте обкладинку</p>
            </div>
            <input
              id="cover"
              type="file"
              accept="image/*"
              @change="handleImageUpload"
              class="file-input"
            />
          </div>
        </div>

        <!-- Title -->
        <div class="form-group">
          <label for="title">Название</label>
          <input
            id="title"
            v-model="formData.title"
            type="text"
            placeholder="Введіть назву історії"
            required
            class="form-input"
          />
        </div>

        <!-- Description -->
        <div class="form-group">
          <label for="description">Опис</label>
          <textarea
            id="description"
            v-model="formData.description"
            placeholder="Опишіть вашу історію"
            rows="6"
            required
            class="form-input form-textarea"
          ></textarea>
        </div>

        <!-- Main Characters -->
        <div class="form-group">
          <label for="characters">Головні персонажі</label>
          <input
            id="characters"
            v-model="formData.characters"
            type="text"
            placeholder="Персонажі через кому (наприклад: Іван, Марія, Петро)"
            class="form-input"
          />
        </div>

        <!-- Categories (Genres) -->
        <div class="form-group">
          <label>Категорія (жанр)</label>
          <div class="checkbox-group _gap-12">
            <label v-for="genre in availableGenres" :key="genre" class="checkbox-label _flex _ai-c">
              <input
                type="checkbox"
                :value="genre"
                v-model="formData.genres"
                class="checkbox-input"
              />
              <span>{{ genre }}</span>
            </label>
          </div>
        </div>

        <!-- Tags -->
        <div class="form-group">
          <label for="tags">Теги</label>
          <input
            id="tags"
            v-model="formData.tags"
            type="text"
            placeholder="Теги через кому (наприклад: фантастика, пригода, любов)"
            class="form-input"
          />
          <div class="tags-preview _flex _flex-wrap _gap-8">
            <span v-for="tag in parsedTags" :key="tag" class="badge-primary _flex _ai-c _gap-6">
              {{ tag }}
              <button
                type="button"
                @click="removeTag(tag)"
                class="tag-remove"
              >×</button>
            </span>
          </div>
        </div>

        <!-- Language -->
        <div class="form-group">
          <label for="language">Мова</label>
          <select v-model="formData.language" id="language" class="form-input" required>
            <option value="">Виберіть мову</option>
            <option value="uk">Українська</option>
            <option value="ru">Русский</option>
            <option value="en">English</option>
            <option value="de">Deutsch</option>
            <option value="fr">Français</option>
            <option value="es">Español</option>
          </select>
        </div>

        <!-- Submit Button -->
        <div class="form-actions _flex _gap-12">
          <button type="submit" class="btn btn-primary btn-lg _flex-1">Опубликовать историю</button>
          <router-link :to="{ name: RouteName.HOME }" class="btn btn-secondary btn-lg _flex-1 _jc-c">
            Отмена
          </router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { RouteName } from "../router/keys";
import { useToast } from "../composables/useToast";
import { api } from "../utils/api";
import { resolveMedia } from "../utils/resolveMedia";

const router = useRouter();
const { show: showToast } = useToast();
const previewImage = ref("");

const availableGenres = [
  "Драма",
  "Романтика",
  "Фантастика",
  "Тайна",
  "Приключение",
  "Научная фантастика",
  "Ужас",
  "Комедия",
  "Детектив",
  "История"
];

const formData = ref({
  title: "",
  description: "",
  characters: "",
  genres: [] as string[],
  tags: "",
  language: "",
  cover: ""
});

const parsedTags = ref<string[]>([]);

const isUploadingCover = ref(false);

const handleImageUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  // Show local preview immediately
  previewImage.value = URL.createObjectURL(file);

  // Upload to server
  isUploadingCover.value = true;
  try {
    const formData2 = new FormData();
    formData2.append('cover', file);
    const res = await api.post('/stories/upload-cover', formData2);
    formData.value.cover = res.url;
    previewImage.value = resolveMedia(res.url);
  } catch (e) {
    showToast('Помилка завантаження обкладинки', 'error');
    previewImage.value = '';
    formData.value.cover = '';
  } finally {
    isUploadingCover.value = false;
  }
};

const removeCover = () => {
  previewImage.value = "";
  formData.value.cover = "";
};

const updateTags = () => {
  if (formData.value.tags.trim()) {
    parsedTags.value = formData.value.tags
      .split(",")
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
  } else {
    parsedTags.value = [];
  }
};

const removeTag = (tag: string) => {
  parsedTags.value = parsedTags.value.filter(t => t !== tag);
  formData.value.tags = parsedTags.value.join(", ");
};

const submitStory = async () => {
  updateTags();
  
  if (!formData.value.title.trim()) {
    showToast("Будь ласка, введіть назву", "warning");
    return;
  }

  if (!formData.value.description.trim()) {
    showToast("Будь ласка, введіть опис", "warning");
    return;
  }

  if (formData.value.genres.length === 0) {
    showToast("Будь ласка, виберіть принаймні один жанр", "warning");
    return;
  }

  if (!formData.value.language) {
    showToast("Будь ласка, виберіть мову", "warning");
    return;
  }

  try {
    const storyPayload = {
      title: formData.value.title,
      description: formData.value.description,
      characters: formData.value.characters,
      genres: formData.value.genres,
      tags: parsedTags.value,
      language: formData.value.language,
      cover: formData.value.cover,
    };

    router.push({
      name: RouteName.WRITE_CHAPTER,
      query: {
        storyData: JSON.stringify(storyPayload),
      },
    });
  } catch (error) {
    console.error("Error submitting story:", error);
    showToast("Ошибка при переходе к написанию главы", "error");
  }
};
</script>

<style scoped>
h1 {
  margin-bottom: 40px;
  text-align: center;
}

.form {
  max-width: 700px;
  margin: 0 auto;
  padding: 32px;
  box-shadow: none;
  border: 1px solid #e5e5e5;
}

.form-group {
  margin-bottom: 24px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: var(--color-text);
  font-size: 0.95rem;
}

.form-textarea {
  min-height: 120px;
}

/* Image Upload */
.image-upload {
  position: relative;
  cursor: pointer;
}

.image-preview {
  position: relative;
  width: 100%;
  max-width: 300px;
  margin: 0 auto;
}

.image-preview img {
  width: 100%;
  height: auto;
  border-radius: 8px;
  display: block;
}

.btn-remove {
  position: absolute;
  top: -10px;
  right: -10px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: var(--color-danger);
  color: white;
  border: none;
  cursor: pointer;
  font-size: 1.2rem;
  transition: background-color 0.3s ease;
}

.btn-remove:hover {
  background-color: var(--color-danger-hover);
}

.upload-placeholder {
  padding: 40px;
  border: 2px dashed var(--color-border);
  border-radius: 8px;
  background-color: #f9f9f9;
  transition: all 0.3s ease;
}

.upload-placeholder:hover {
  border-color: var(--color-primary);
  background-color: #f0f7ff;
}

.upload-placeholder svg {
  color: #999;
  margin-bottom: 12px;
}

.upload-placeholder p {
  color: var(--color-text-muted);
  margin: 0;
}

.file-input {
  position: absolute;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
  top: 0;
  left: 0;
}

.image-upload {
  position: relative;
}

/* Checkboxes */
.checkbox-group {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
}

.checkbox-label {
  cursor: pointer;
  padding: 8px;
  border-radius: var(--radius-sm);
  transition: background-color 0.2s ease;
}

.checkbox-label:hover {
  background-color: #f5f5f5;
}

.checkbox-input {
  width: 18px;
  height: 18px;
  margin-right: 8px;
  cursor: pointer;
  accent-color: var(--color-primary);
}

.checkbox-label span {
  color: var(--color-text);
}

/* Tags */
.tags-preview {
  margin-top: 12px;
}

.tag-remove {
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  font-size: 1.2rem;
  padding: 0;
  line-height: 1;
  transition: opacity 0.2s ease;
}

.tag-remove:hover {
  opacity: 0.7;
}

/* Form Actions */
.form-actions {
  margin-top: 32px;
}

@media (max-width: 768px) {
  .form {
    padding: 20px;
  }

  .checkbox-group {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  }

  .form-actions {
    flex-direction: column;
  }
}
</style>
