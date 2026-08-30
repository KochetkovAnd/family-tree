<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { getPersonPhotos, setPrimaryPhoto, untagPhoto, uploadPhoto } from '../api'
import type { Photo } from '../types/domain'

const props = defineProps<{ personId: string; primaryPhotoId?: string }>()
const emit = defineEmits<{ changed: [] }>()

const photos = ref<Photo[]>([])
const uploading = ref(false)

async function refresh() {
  photos.value = await getPersonPhotos(props.personId)
}

onMounted(refresh)
watch(() => props.personId, refresh)

async function onFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  uploading.value = true
  try {
    const photo = await uploadPhoto(file, [props.personId])
    if (!props.primaryPhotoId) {
      await setPrimaryPhoto(props.personId, photo.id)
    }
    await refresh()
    emit('changed')
  } finally {
    uploading.value = false
    ;(e.target as HTMLInputElement).value = ''
  }
}

async function makePrimary(photoId: string) {
  await setPrimaryPhoto(props.personId, photoId)
  emit('changed')
}

async function removeTag(photoId: string) {
  if (!confirm('Открепить это фото от человека? Если фото больше ни с кем не связано, оно будет удалено.')) return
  await untagPhoto(props.personId, photoId)
  await refresh()
  emit('changed')
}
</script>

<template>
  <div class="gallery">
    <div class="grid">
      <div v-for="photo in photos" :key="photo.id" class="cell" :class="{ primary: photo.id === primaryPhotoId }">
        <img :src="photo.thumbnailUrl" :alt="photo.caption ?? ''" />
        <span v-if="photo.id === primaryPhotoId" class="badge">Главное</span>
        <div class="cell-actions">
          <button v-if="photo.id !== primaryPhotoId" type="button" @click="makePrimary(photo.id)">Сделать главным</button>
          <button type="button" class="danger" @click="removeTag(photo.id)">Открепить</button>
        </div>
      </div>

      <label class="cell upload-cell" :class="{ busy: uploading }">
        <input type="file" accept="image/*" :disabled="uploading" @change="onFileChange" />
        <span>{{ uploading ? 'Загрузка…' : '+ Добавить фото' }}</span>
      </label>
    </div>
  </div>
</template>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
  gap: 10px;
}
.cell {
  position: relative;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  background: #eee;
  border: 2px solid transparent;
}
.cell.primary {
  border-color: #3b6ea5;
}
.cell img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.badge {
  position: absolute;
  top: 4px;
  left: 4px;
  font-size: 10px;
  background: #3b6ea5;
  color: #fff;
  padding: 2px 5px;
  border-radius: 4px;
}
.cell-actions {
  position: absolute;
  inset: auto 0 0 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 4px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.65), transparent);
  opacity: 0;
  transition: opacity 0.12s;
}
.cell:hover .cell-actions {
  opacity: 1;
}
.cell-actions button {
  font-size: 10px;
  padding: 3px 4px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  background: #fff;
}
.cell-actions button.danger {
  background: #f3d4d4;
}
.upload-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  border: 2px dashed #c7cdd6;
  color: #6b7280;
  font-size: 11px;
  cursor: pointer;
  padding: 4px;
}
.upload-cell.busy {
  opacity: 0.6;
  cursor: default;
}
.upload-cell input {
  display: none;
}
</style>
