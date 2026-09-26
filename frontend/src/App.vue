<script setup lang="ts">
import { session } from './auth/authState'
import LoginPage from './components/LoginPage.vue'
import FamilyTree from './components/FamilyTree.vue'
</script>

<template>
  <LoginPage v-if="!session" />
  <FamilyTree v-else />
</template>
