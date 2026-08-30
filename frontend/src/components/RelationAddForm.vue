<script setup lang="ts">
import { ref, watch } from 'vue'
import { createPerson, createRelationship, listPersons } from '../api'
import type { Gender, Person, RelationshipType } from '../types/domain'

export type RelationKind = 'PARENT' | 'CHILD' | 'SPOUSE' | 'SIBLING'

const props = defineProps<{ kind: RelationKind; personId: string }>()
const emit = defineEmits<{ added: []; cancel: [] }>()

const mode = ref<'existing' | 'new'>('existing')

const query = ref('')
const results = ref<Person[]>([])
const selected = ref<Person | null>(null)
let searchTimer: ReturnType<typeof setTimeout> | undefined

watch(query, (q) => {
  selected.value = null
  clearTimeout(searchTimer)
  if (!q.trim()) {
    results.value = []
    return
  }
  searchTimer = setTimeout(async () => {
    const found = await listPersons(q)
    results.value = found.filter((p) => p.id !== props.personId)
  }, 200)
})

const newLastName = ref('')
const newFirstName = ref('')
const newMiddleName = ref('')
const newGender = ref<Gender>('MALE')

const saving = ref(false)

function relationTypeOf(kind: RelationKind): RelationshipType {
  return kind === 'SPOUSE' ? 'SPOUSE' : kind === 'SIBLING' ? 'SIBLING' : 'PARENT_CHILD'
}

// Direction follows from which button the user clicked, not from the picked person.
function participantsFor(kind: RelationKind, currentId: string, otherId: string): [string, string] {
  if (kind === 'PARENT') return [otherId, currentId] // otherId is the parent
  if (kind === 'CHILD') return [currentId, otherId]
  return [currentId, otherId] // SPOUSE / SIBLING: order doesn't carry meaning
}

async function submit() {
  saving.value = true
  try {
    let otherId: string
    if (mode.value === 'existing') {
      if (!selected.value) return
      otherId = selected.value.id
    } else {
      if (!newLastName.value.trim() || !newFirstName.value.trim()) return
      const created = await createPerson({
        lastName: newLastName.value.trim(),
        firstName: newFirstName.value.trim(),
        middleName: newMiddleName.value.trim() || undefined,
        gender: newGender.value,
      })
      otherId = created.id
    }

    const [personAId, personBId] = participantsFor(props.kind, props.personId, otherId)
    await createRelationship({
      type: relationTypeOf(props.kind),
      personAId,
      personBId,
      ...(props.kind === 'SPOUSE' ? { status: 'MARRIED' as const } : {}),
    })
    emit('added')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="relation-add">
    <div class="mode-switch">
      <button type="button" :class="{ active: mode === 'existing' }" @click="mode = 'existing'">Существующий человек</button>
      <button type="button" :class="{ active: mode === 'new' }" @click="mode = 'new'">Новый человек</button>
    </div>

    <div v-if="mode === 'existing'" class="existing">
      <input v-model="query" type="text" placeholder="Введите фамилию или имя…" />
      <ul v-if="results.length" class="results">
        <li
          v-for="p in results"
          :key="p.id"
          :class="{ selected: selected?.id === p.id }"
          @click="selected = p; query = `${p.lastName} ${p.firstName}`"
        >
          {{ p.lastName }} {{ p.firstName }} {{ p.middleName }}
        </li>
      </ul>
      <p v-else-if="query.trim()" class="hint">Никого не найдено — можно создать нового.</p>
    </div>

    <div v-else class="new-person">
      <input v-model="newLastName" type="text" placeholder="Фамилия *" />
      <input v-model="newFirstName" type="text" placeholder="Имя *" />
      <input v-model="newMiddleName" type="text" placeholder="Отчество" />
      <select v-model="newGender">
        <option value="MALE">Мужской</option>
        <option value="FEMALE">Женский</option>
      </select>
    </div>

    <div class="actions">
      <button type="button" class="btn" :disabled="saving" @click="submit">Добавить</button>
      <button type="button" class="btn btn-ghost" @click="emit('cancel')">Отмена</button>
    </div>
  </div>
</template>

<style scoped>
.relation-add {
  margin-top: 8px;
  padding: 10px;
  background: #f7f8fa;
  border-radius: 8px;
  border: 1px solid #e3e6ea;
}
.mode-switch {
  display: flex;
  gap: 6px;
  margin-bottom: 8px;
}
.mode-switch button {
  flex: 1;
  padding: 5px 8px;
  font-size: 12px;
  border: 1px solid #d6dbe3;
  background: #fff;
  border-radius: 6px;
  cursor: pointer;
}
.mode-switch button.active {
  background: #3b6ea5;
  color: #fff;
  border-color: #3b6ea5;
}
.existing input,
.new-person input,
.new-person select {
  width: 100%;
  box-sizing: border-box;
  padding: 6px 8px;
  margin-bottom: 6px;
  border: 1px solid #d6dbe3;
  border-radius: 6px;
  font-size: 13px;
}
.results {
  list-style: none;
  margin: 0 0 6px;
  padding: 0;
  max-height: 140px;
  overflow-y: auto;
  border: 1px solid #e3e6ea;
  border-radius: 6px;
}
.results li {
  padding: 6px 8px;
  font-size: 13px;
  cursor: pointer;
}
.results li:hover,
.results li.selected {
  background: #e8f0fa;
}
.hint {
  font-size: 12px;
  color: #6b7280;
  margin: 0 0 6px;
}
.actions {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}
</style>
