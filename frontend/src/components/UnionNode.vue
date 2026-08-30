<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
</script>

<template>
  <div class="union-dot">
    <Handle id="t" type="target" :position="Position.Top" class="anchor" />
    <Handle id="b" type="source" :position="Position.Bottom" class="anchor" />
  </div>
</template>

<style scoped>
.union-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #9aa6b2;
}
.anchor {
  opacity: 0;
  pointer-events: none;
  width: 1px;
  height: 1px;
}
</style>
