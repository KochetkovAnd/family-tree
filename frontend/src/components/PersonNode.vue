<script setup lang="ts">
import { computed } from 'vue'
import { Handle, Position, useVueFlow } from '@vue-flow/core'
import type { TreeNode } from '../types/domain'
import { initialsOf } from '../api/avatar'

const props = defineProps<{
  data: TreeNode
  selected?: boolean
}>()

// LOD: below the zoom threshold only name + years render — no <img> is even
// mounted, so the browser never fetches thumbnails for a zoomed-out tree.
const PHOTO_ZOOM_THRESHOLD = 0.75

const { viewport } = useVueFlow()
const showPhoto = computed(() => viewport.value.zoom >= PHOTO_ZOOM_THRESHOLD)

const fullName = computed(() => `${props.data.lastName} ${props.data.firstName}`)
const years = computed(() => {
  const birth = props.data.birthDate?.slice(0, 4)
  const death = props.data.deathDate?.slice(0, 4)
  if (!birth && !death) return ''
  return death ? `${birth ?? '?'} – ${death}` : `${birth ?? '?'}`
})
</script>

<template>
  <div class="person-node" :class="{ 'is-selected': selected, 'is-deceased': !!data.deathDate }">
    <Handle id="t" type="target" :position="Position.Top" class="anchor" />
    <Handle id="ts" type="source" :position="Position.Top" class="anchor" />
    <Handle id="b" type="source" :position="Position.Bottom" class="anchor" />
    <Handle id="l-source" type="source" :position="Position.Left" class="anchor" />
    <Handle id="l-target" type="target" :position="Position.Left" class="anchor" />
    <Handle id="r-source" type="source" :position="Position.Right" class="anchor" />
    <Handle id="r-target" type="target" :position="Position.Right" class="anchor" />
    <!-- Sits a bit below the plain l-source/r-source pair (used by the
         marriage line) so a couple's own line down to their children's union
         dot reads as its own line just under the marriage line, not as an
         exact overlap with it. -->
    <Handle id="l-source-union" type="source" :position="Position.Left" class="anchor" style="top: calc(50% + 10px)" />
    <Handle id="r-source-union" type="source" :position="Position.Right" class="anchor" style="top: calc(50% + 10px)" />

    <div v-if="showPhoto" class="photo">
      <img v-if="data.thumbnailUrl" :src="data.thumbnailUrl" :alt="fullName" draggable="false" />
      <div v-else class="photo-placeholder">{{ initialsOf(data.firstName, data.lastName) }}</div>
    </div>
    <div class="info">
      <div class="name">{{ fullName }}</div>
      <div v-if="years" class="years">{{ years }}</div>
    </div>
  </div>
</template>

<style scoped>
.person-node {
  width: 170px;
  padding: 8px 10px;
  border-radius: 10px;
  background: var(--panel-bg, #fff);
  border: 2px solid #d6dbe3;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  text-align: center;
  cursor: pointer;
  transition: border-color 0.15s;
}
.person-node.is-selected {
  border-color: #3b6ea5;
}
.person-node.is-deceased {
  background: #f4f4f4;
}
.anchor {
  opacity: 0;
  pointer-events: none;
  width: 1px;
  height: 1px;
}
.photo {
  width: 64px;
  height: 64px;
  margin: 0 auto 6px;
  border-radius: 50%;
  overflow: hidden;
  background: #eee;
}
.photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.photo-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: #888;
}
.name {
  font-size: 13px;
  font-weight: 600;
  line-height: 1.25;
  color: #1c1e21;
}
.years {
  font-size: 11px;
  color: #6b7280;
  margin-top: 2px;
}
</style>
