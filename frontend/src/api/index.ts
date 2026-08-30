// Single import surface for the whole mock API — mirrors docs/api.md.
// Swapping to the real backend later means rewriting the files under src/api/
// to issue fetch() calls instead of touching src/api/db.ts; this barrel and
// every consumer stays the same.
export * from './people'
export * from './relationships'
export * from './photos'
export * from './tree'
export { ApiError } from './errors'
export { resetDb } from './db'
