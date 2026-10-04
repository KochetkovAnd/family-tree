<script setup lang="ts">
import { ref } from 'vue'
import { login } from '../auth/authApi'
import { setSession } from '../auth/authState'
import { ApiError } from '../api/errors'

const nickname = ref('')
const password = ref('')

const submitting = ref(false)
const error = ref('')

async function submit() {
  error.value = ''
  if (!nickname.value.trim() || !password.value.trim()) {
    error.value = 'Заполните все поля'
    return
  }

  submitting.value = true
  try {
    const session = await login({ nickname: nickname.value.trim(), password: password.value })
    setSession(session)
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : 'Не удалось выполнить запрос'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <form class="login-card" @submit.prevent="submit">
      <h1>Семейное дерево</h1>
      <p class="subtitle">Вход</p>

      <label>Имя<input v-model="nickname" type="text" autocomplete="username" /></label>
      <label>
        Пароль
        <input v-model="password" type="password" autocomplete="current-password" />
      </label>

      <p v-if="error" class="error">{{ error }}</p>

      <button type="submit" class="btn" :disabled="submitting">Войти</button>
    </form>
  </div>
</template>

<style scoped>
.login-page {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f7f8fa;
}
.login-card {
  width: min(340px, 90vw);
  background: #fff;
  border-radius: 12px;
  padding: 28px 24px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.12);
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.login-card h1 {
  font-size: 18px;
  margin: 0;
  text-align: center;
}
.subtitle {
  margin: 0 0 8px;
  text-align: center;
  color: #6b7280;
  font-size: 13px;
}
label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: #4b5563;
}
input {
  font: inherit;
  padding: 7px 9px;
  border: 1px solid #d6dbe3;
  border-radius: 6px;
}
.error {
  margin: 0;
  color: #b64545;
  font-size: 12px;
}
</style>
