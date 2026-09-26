import { ref } from 'vue'
import type { AuthSession } from './types'

const STORAGE_KEY = 'family-tree-auth-session'

function load(): AuthSession | null {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as AuthSession
  } catch {
    return null
  }
}

// Module-level singleton (same pattern as src/api/db.ts) rather than Pinia —
// this is the one bit of global state the app needs, not worth a store lib.
export const session = ref<AuthSession | null>(load())

export function setSession(next: AuthSession) {
  session.value = next
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
}

export function clearSession() {
  session.value = null
  localStorage.removeItem(STORAGE_KEY)
}

export function authHeader(): Record<string, string> {
  return session.value ? { Authorization: `Bearer ${session.value.token}` } : {}
}
