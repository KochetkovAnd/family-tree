// Mirrors the error shape from docs/api.md so error handling in components
// doesn't need to change when the mock is swapped for real HTTP calls.
export class ApiError extends Error {
  error: string

  constructor(error: string, message: string) {
    super(message)
    this.error = error
  }
}
