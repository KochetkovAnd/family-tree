import { authHeader } from '../auth/authState'
import { ApiError } from './errors'

// Unlike the rest of src/api/ (which still talks to the in-memory mock —
// see docs/api.md), this calls the real backend directly, same as
// auth/authApi.ts — /api/family-tree is a real, built endpoint, and it's
// behind the JWT filter (everything except /api/auth/** is), so it needs
// authHeader() too.
const BASE_URL = 'http://localhost:8080/api/family-tree'

export interface FamilyTreeSummary {
  id: number
  name: string
}

export async function findTreesByUser(userId: number): Promise<FamilyTreeSummary[]> {
  let response: Response
  try {
    response = await fetch(`${BASE_URL}/find-by-user/${userId}`, {
      headers: authHeader(),
    })
  } catch {
    throw new ApiError('NETWORK_ERROR', 'Не удалось связаться с сервером — он запущен?')
  }

  const data = await response.json().catch(() => null)
  if (!response.ok) {
    throw new ApiError(data?.error ?? 'UNKNOWN_ERROR', data?.message ?? 'Не удалось получить список деревьев')
  }
  return data as FamilyTreeSummary[]
}
