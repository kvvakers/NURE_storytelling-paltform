<template>
  <header class="header">
    <div class="header-container _container">
      <div class="_flex _flex-full _gap-x-32">
        <div class="logo">
          <img src="../assets/logo.svg" alt="Logo" class="logo-img" />
          <span class="logo-text">Storytelling</span>
        </div>

        <div class="search-bar">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search stories..."
            class="search-input"
          />
        </div>
      </div>

      <div class="actions">
        <button class="btn btn-write" @click="handleWrite">Write</button>
        <button class="btn btn-login" @click="handleLogin">Login</button>
        <button class="btn btn-signup" @click="handleSignUp">Sign Up</button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref } from "vue";

const searchQuery = ref("");

const handleWrite = () => {
  console.log("Write clicked");
};

const handleLogin = () => {
  console.log("Login clicked");
};

const handleSignUp = () => {
  console.log("Sign Up clicked");
};
</script>

<style scoped>
.header {
  background-color: #fff;
  border-bottom: 1px solid #e0e0e0;
  padding: 1rem 0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.logo-img {
  height: 40px;
  width: auto;
}

.logo-text {
  font-size: 1.5rem;
  font-weight: 700;
  color: #333;
}

.search-bar {
  max-width: 600px;
  flex: 1 1 auto;
  display: flex;
  align-items: center;
  background-color: #f5f5f5;
  border-radius: 24px;
  padding: 0.5rem 1rem;
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font-size: 1rem;
}

.search-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.2rem;
}

.actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

.btn {
  padding: 0.6rem 1.2rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-write {
  background-color: #007bff;
  color: white;
}

.btn-write:hover {
  background-color: #0056b3;
}

.btn-login {
  background-color: transparent;
  color: #333;
  border: 1px solid #ddd;
}

.btn-login:hover {
  background-color: #f5f5f5;
}

.btn-signup {
  background-color: #28a745;
  color: white;
}

.btn-signup:hover {
  background-color: #218838;
}
</style>
