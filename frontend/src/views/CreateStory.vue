<template>
  <div class="create-story">
    <div class="_container">
      <h1 class="_h1">Створити історію</h1>
      
      <form @submit.prevent="submitStory" class="form">
        <!-- Cover Image -->
        <div class="form-group">
          <label for="cover">Обкладинка</label>
          <div class="image-upload">
            <div v-if="previewImage" class="image-preview">
              <img :src="previewImage" :alt="formData.title || 'Preview'" />
              <button type="button" @click="removeCover" class="btn-remove">✕</button>
            </div>
            <div v-else class="upload-placeholder">
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
            class="input"
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
            class="textarea"
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
            class="input"
          />
        </div>

        <!-- Categories (Genres) -->
        <div class="form-group">
          <label>Категорія (жанр)</label>
          <div class="checkbox-group">
            <label v-for="genre in availableGenres" :key="genre" class="checkbox-label">
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
            class="input"
          />
          <div class="tags-preview">
            <span v-for="tag in parsedTags" :key="tag" class="tag">
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
          <select v-model="formData.language" id="language" class="select" required>
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
        <div class="form-actions">
          <button type="submit" class="btn btn-primary btn-lg">Опубликовать историю</button>
          <router-link :to="{ name: RouteName.HOME }" class="btn btn-secondary btn-lg">
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

const handleImageUpload = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      previewImage.value = dataUrl;
      formData.value.cover = dataUrl;
    };
    reader.readAsDataURL(file);
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
.create-story {
  padding: 40px 0;
  min-height: 100vh;
}

h1 {
  margin-bottom: 40px;
  text-align: center;
}

.form {
  max-width: 700px;
  margin: 0 auto;
  background: #fff;
  padding: 32px;
  border-radius: 12px;
  border: 1px solid #e5e5e5;
}

.form-group {
  margin-bottom: 24px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #333;
  font-size: 0.95rem;
}

.input,
.textarea,
.select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  font-family: inherit;
  transition: border-color 0.3s ease;
}

.input:focus,
.textarea:focus,
.select:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

.textarea {
  resize: vertical;
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
  background-color: #dc3545;
  color: white;
  border: none;
  cursor: pointer;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.3s ease;
}

.btn-remove:hover {
  background-color: #c82333;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  border: 2px dashed #ddd;
  border-radius: 8px;
  background-color: #f9f9f9;
  transition: all 0.3s ease;
}

.upload-placeholder:hover {
  border-color: #007bff;
  background-color: #f0f7ff;
}

.upload-placeholder svg {
  color: #999;
  margin-bottom: 12px;
}

.upload-placeholder p {
  color: #666;
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
  gap: 12px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
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
  accent-color: #007bff;
}

.checkbox-label span {
  color: #333;
}

/* Tags */
.tags-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background-color: #e7f3ff;
  color: #007bff;
  border-radius: 20px;
  font-size: 0.9rem;
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
  display: flex;
  gap: 12px;
  margin-top: 32px;
}

.btn-lg {
  flex: 1;
  padding: 12px 24px;
  font-size: 1rem;
  font-weight: 600;
}

.btn-secondary {
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
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
