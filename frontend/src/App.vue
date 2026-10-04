<script setup lang="ts">
import { session } from './auth/authState'
import { selectedTree } from './state/selectedTree'
import LoginPage from './components/LoginPage.vue'
import TreeSelectPage from './components/TreeSelectPage.vue'
import FamilyTree from './components/FamilyTree.vue'
</script>

<template>
  <LoginPage v-if="!session" />
  <TreeSelectPage v-else-if="!selectedTree" />
  <FamilyTree v-else />
</template>
