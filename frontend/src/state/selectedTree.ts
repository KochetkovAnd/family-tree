import { ref } from 'vue'

const STORAGE_KEY = 'family-tree-selected-tree'

export interface SelectedTree {
  id: number
  name: string
}

function load(): SelectedTree | null {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as SelectedTree
  } catch {
    return null
  }
}

// Same module-level-singleton pattern as authState.ts — gates FamilyTree.vue
// the way `session` gates the whole app, one level down (picked after login,
// not known at login time since a user can have several trees).
export const selectedTree = ref<SelectedTree | null>(load())

export function selectTree(tree: SelectedTree) {
  selectedTree.value = tree
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tree))
}

export function clearSelectedTree() {
  selectedTree.value = null
  localStorage.removeItem(STORAGE_KEY)
}
