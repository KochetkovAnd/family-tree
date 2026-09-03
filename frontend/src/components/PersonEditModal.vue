<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import {
  createPerson,
  deletePerson,
  deleteRelationship,
  getPerson,
  getRelatives,
  listRelationships,
  updatePerson,
} from '../api'
import type { Gender, Person, PersonInput, Relatives, Relationship, RelationshipType } from '../types/domain'
import PhotoGallery from './PhotoGallery.vue'
import RelationAddForm from './RelationAddForm.vue'

const props = defineProps<{ personId: string | null }>()
const emit = defineEmits<{ close: [changed: boolean] }>()

const currentId = ref<string | null>(props.personId)
const loading = ref(true)
const saving = ref(false)
const changed = ref(false)

const emptyForm = (): PersonInput => ({
  firstName: '',
  lastName: '',
  middleName: '',
  maidenName: '',
  gender: 'MALE' as Gender,
  birthDate: '',
  birthPlace: '',
  deathDate: '',
  deathPlace: '',
  notes: '',
})

const form = reactive<PersonInput>(emptyForm())
const primaryPhotoId = ref<string | undefined>(undefined)

const relatives = ref<Relatives>({ parents: [], children: [], spouses: [], siblings: [] })
const relationshipRecords = ref<Relationship[]>([])
const addFormOpen = ref(false)

interface RelationRow { person: Person; type: RelationshipType; label: string }

const relationRows = computed<RelationRow[]>(() => [
  ...relatives.value.parents.map((person) => ({ person, type: 'PARENT_CHILD' as const, label: 'Родитель' })),
  ...relatives.value.children.map((person) => ({ person, type: 'PARENT_CHILD' as const, label: 'Ребёнок' })),
  ...relatives.value.spouses.map((person) => ({ person, type: 'SPOUSE' as const, label: 'Супруг(а)' })),
  ...relatives.value.siblings.map((person) => ({ person, type: 'SIBLING' as const, label: 'Брат/сестра' })),
])

const isCreating = computed(() => currentId.value === null)
const title = computed(() =>
  isCreating.value ? 'Новый человек' : `${form.lastName} ${form.firstName}`.trim() || 'Человек',
)

function applyPerson(person: Person) {
  Object.assign(form, {
    firstName: person.firstName,
    lastName: person.lastName,
    middleName: person.middleName ?? '',
    maidenName: person.maidenName ?? '',
    gender: person.gender,
    birthDate: person.birthDate ?? '',
    birthPlace: person.birthPlace ?? '',
    deathDate: person.deathDate ?? '',
    deathPlace: person.deathPlace ?? '',
    notes: person.notes ?? '',
  })
  primaryPhotoId.value = person.primaryPhotoId
}

async function refreshRelatives() {
  if (!currentId.value) return
  relatives.value = await getRelatives(currentId.value)
  relationshipRecords.value = await listRelationships(currentId.value)
}

async function load() {
  loading.value = true
  if (currentId.value) {
    const person = await getPerson(currentId.value)
    applyPerson(person)
    await refreshRelatives()
  }
  loading.value = false
}

onMounted(load)

function findRelationship(type: RelationshipType, relatedId: string) {
  return relationshipRecords.value.find(
    (r) =>
      r.type === type &&
      ((r.personAId === currentId.value && r.personBId === relatedId) ||
        (r.personBId === currentId.value && r.personAId === relatedId)),
  )
}

async function removeRelationship(type: RelationshipType, related: Person, label: string) {
  const rec = findRelationship(type, related.id)
  if (!rec) return
  if (!confirm(`Удалить связь «${label}» с ${related.lastName} ${related.firstName}?`)) return
  await deleteRelationship(rec.id)
  await refreshRelatives()
  changed.value = true
}

function toggleAdd() {
  addFormOpen.value = !addFormOpen.value
}

async function onRelationAdded() {
  addFormOpen.value = false
  await refreshRelatives()
  changed.value = true
}

async function onPhotosChanged() {
  changed.value = true
  if (currentId.value) {
    const person = await getPerson(currentId.value)
    primaryPhotoId.value = person.primaryPhotoId
  }
}

function toInput(): PersonInput {
  return {
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    middleName: form.middleName?.trim() || undefined,
    maidenName: form.maidenName?.trim() || undefined,
    gender: form.gender,
    birthDate: form.birthDate || undefined,
    birthPlace: form.birthPlace?.trim() || undefined,
    deathDate: form.deathDate || undefined,
    deathPlace: form.deathPlace?.trim() || undefined,
    notes: form.notes?.trim() || undefined,
    primaryPhotoId: primaryPhotoId.value,
  }
}

async function save() {
  if (!form.firstName.trim() || !form.lastName.trim()) {
    alert('Укажите как минимум фамилию и имя.')
    return
  }
  saving.value = true
  try {
    if (isCreating.value) {
      const created = await createPerson(toInput())
      currentId.value = created.id
      changed.value = true
      await refreshRelatives()
    } else {
      await updatePerson(currentId.value!, toInput())
      changed.value = true
    }
  } finally {
    saving.value = false
  }
}

async function removePerson() {
  if (!currentId.value) return
  if (!confirm(`Удалить ${form.lastName} ${form.firstName} из дерева вместе со всеми связями?`)) return
  await deletePerson(currentId.value)
  emit('close', true)
}

function close() {
  emit('close', changed.value)
}
</script>

<template>
  <div class="overlay" @click.self="close">
    <div class="modal">
      <header class="modal-header">
        <h2>{{ title }}</h2>
        <button type="button" class="icon-btn" @click="close">×</button>
      </header>

      <div v-if="loading" class="loading">Загрузка…</div>

      <div v-else class="modal-body">
        <section class="fields">
          <div class="grid">
            <label>Фамилия *<input v-model="form.lastName" type="text" /></label>
            <label>Имя *<input v-model="form.firstName" type="text" /></label>
            <label>Отчество<input v-model="form.middleName" type="text" /></label>
            <label v-if="form.gender === 'FEMALE'">Девичья фамилия<input v-model="form.maidenName" type="text" /></label>
            <label>Пол
              <select v-model="form.gender">
                <option value="MALE">Мужской</option>
                <option value="FEMALE">Женский</option>
              </select>
            </label>
            <label>Дата рождения<input v-model="form.birthDate" type="date" /></label>
            <label>Место рождения<input v-model="form.birthPlace" type="text" /></label>
            <label>Дата смерти<input v-model="form.deathDate" type="date" /></label>
            <label>Место смерти<input v-model="form.deathPlace" type="text" /></label>
          </div>
          <label class="notes">Заметки<textarea v-model="form.notes" rows="2"></textarea></label>
        </section>

        <section v-if="!isCreating" class="section">
          <h3>Фото</h3>
          <PhotoGallery :person-id="currentId!" :primary-photo-id="primaryPhotoId" @changed="onPhotosChanged" />
        </section>
        <section v-else class="section hint-section">
          <p class="hint">Фото и родственные связи можно добавить сразу после сохранения.</p>
        </section>

        <section v-if="!isCreating" class="section">
          <div class="section-header">
            <h3>Родственные связи</h3>
            <button type="button" class="btn btn-ghost small" @click="toggleAdd">+ Добавить</button>
          </div>

          <RelationAddForm
            v-if="addFormOpen"
            :person-id="currentId!"
            @added="onRelationAdded"
            @cancel="addFormOpen = false"
          />

          <table v-if="relationRows.length" class="relations-table">
            <thead>
              <tr>
                <th>Человек</th>
                <th>Связь</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in relationRows" :key="row.type + row.label + row.person.id">
                <td>{{ row.person.lastName }} {{ row.person.firstName }}</td>
                <td>{{ row.label }}</td>
                <td class="remove-cell">
                  <button type="button" class="remove" @click="removeRelationship(row.type, row.person, row.label)">✕</button>
                </td>
              </tr>
            </tbody>
          </table>
          <p v-else class="hint">Родственных связей пока нет.</p>
        </section>
      </div>

      <footer class="modal-footer">
        <button v-if="!isCreating" type="button" class="btn btn-danger" @click="removePerson">Удалить человека</button>
        <div class="spacer"></div>
        <button type="button" class="btn btn-ghost" @click="close">Закрыть</button>
        <button type="button" class="btn" :disabled="saving" @click="save">
          {{ isCreating ? 'Создать' : 'Сохранить' }}
        </button>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(20, 24, 30, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}
.modal {
  width: min(560px, 92vw);
  max-height: 88vh;
  background: #fff;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.25);
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid #eee;
}
.modal-header h2 {
  font-size: 17px;
  margin: 0;
}
.icon-btn {
  border: none;
  background: none;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  color: #6b7280;
}
.modal-body {
  padding: 16px 18px;
  overflow-y: auto;
}
.loading {
  padding: 40px;
  text-align: center;
  color: #6b7280;
}
.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px 12px;
}
label {
  display: flex;
  flex-direction: column;
  font-size: 12px;
  color: #4b5563;
  gap: 4px;
}
.notes {
  margin-top: 10px;
}
input,
select,
textarea {
  font: inherit;
  padding: 6px 8px;
  border: 1px solid #d6dbe3;
  border-radius: 6px;
}
.section {
  margin-top: 18px;
  padding-top: 14px;
  border-top: 1px solid #eee;
}
.section h3 {
  font-size: 14px;
  margin: 0 0 10px;
}
.hint {
  font-size: 12px;
  color: #6b7280;
  margin: 0;
}
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}
.section-header h3 {
  margin: 0;
}
.relations-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.relations-table th {
  text-align: left;
  font-size: 11px;
  font-weight: 600;
  color: #6b7280;
  padding: 0 0 6px;
  border-bottom: 1px solid #eee;
}
.relations-table td {
  padding: 6px 0;
  border-bottom: 1px solid #f3f4f6;
}
.relations-table td:nth-child(2) {
  color: #4b5563;
}
.remove-cell {
  text-align: right;
  width: 24px;
}
.remove {
  border: none;
  background: none;
  color: #b64545;
  cursor: pointer;
  font-size: 13px;
}
.modal-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 18px;
  border-top: 1px solid #eee;
}
.spacer {
  flex: 1;
}
</style>
