// Mirrors the real backend's DTOs (backend/.../dto/auth/*.java) — this is the
// one slice of the frontend that talks to the actual Spring server, not the
// in-memory mock in src/api/ (see CLAUDE.md).

export interface AuthUser {
  userId: number
  email: string
  displayName: string
}

export interface AuthSession extends AuthUser {
  token: string
  expiresInSeconds: number
}

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  email: string
  password: string
  displayName: string
}
