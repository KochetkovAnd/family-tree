import { ApiError } from '../api/errors'
import type { AuthSession, LoginPayload, RegisterPayload } from './types'

// The only part of the frontend that calls the real Spring backend directly —
// everything else (src/api/*) still talks to the in-memory mock. Auth had to
// be real from the start since bcrypt/JWT only mean something server-side.
const BASE_URL = 'http://localhost:8080/api/auth'

async function post(path: string, body: unknown): Promise<AuthSession> {
  let response: Response
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch {
    throw new ApiError('NETWORK_ERROR', 'Не удалось связаться с сервером — он запущен?')
  }

  const data = await response.json().catch(() => null)
  if (!response.ok) {
    throw new ApiError(data?.error ?? 'UNKNOWN_ERROR', data?.message ?? 'Не удалось выполнить запрос')
  }
  return data as AuthSession
}

export function login(payload: LoginPayload): Promise<AuthSession> {
  return post('/login', payload)
}

export function register(payload: RegisterPayload): Promise<AuthSession> {
  return post('/register', payload)
}
