<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { findTreesByUser, type FamilyTreeSummary } from '../api/familyTree'
import { selectTree } from '../state/selectedTree'
import { session, clearSession } from '../auth/authState'
import { ApiError } from '../api/errors'

const trees = ref<FamilyTreeSummary[]>([])
const loading = ref(true)
const error = ref('')

async function load() {
  loading.value = true
  error.value = ''
  try {
    trees.value = await findTreesByUser(session.value!.userId)
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : 'Не удалось выполнить запрос'
  } finally {
    loading.value = false
  }
}

onMounted(load)

function pick(tree: FamilyTreeSummary) {
  selectTree(tree)
}
</script>

<template>
  <div class="select-page">
    <div class="select-card">
      <header class="select-header">
        <h1>Выбор дерева</h1>
        <span v-if="session" class="user-name">{{ session.displayName }}</span>
      </header>

      <p v-if="loading" class="status">Загрузка…</p>
      <div v-else-if="error" class="status">
        <p class="error">{{ error }}</p>
        <button class="btn btn-ghost" @click="load">Повторить</button>
      </div>
      <p v-else-if="trees.length === 0" class="status">
        У вас пока нет доступных деревьев.
      </p>
      <ul v-else class="tree-list">
        <li v-for="tree in trees" :key="tree.id">
          <button class="tree-item" @click="pick(tree)">{{ tree.name }}</button>
        </li>
      </ul>

      <button class="btn btn-ghost logout" @click="clearSession">Выйти</button>
    </div>
  </div>
</template>

<style scoped>
.select-page {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f7f8fa;
}
.select-card {
  width: min(420px, 90vw);
  background: #fff;
  border-radius: 12px;
  padding: 28px 24px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.12);
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.select-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}
.select-header h1 {
  font-size: 18px;
  margin: 0;
}
.user-name {
  font-size: 13px;
  color: #6b7280;
}
.status {
  margin: 0;
  color: #6b7280;
  font-size: 13px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}
.error {
  margin: 0;
  color: #b64545;
}
.tree-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.tree-item {
  width: 100%;
  text-align: left;
  padding: 12px 14px;
  border: 1px solid #d6dbe3;
  border-radius: 8px;
  background: #fff;
  font: inherit;
  font-size: 14px;
  cursor: pointer;
}
.tree-item:hover {
  background: #eef3f9;
  border-color: #3b6ea5;
}
.logout {
  align-self: flex-start;
}
</style>
