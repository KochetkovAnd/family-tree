import { v4 as uuid } from 'uuid'
import { db, persist } from './db'
import { ApiError } from './errors'
import type { Relationship } from '../types/domain'

const delay = () => new Promise((r) => setTimeout(r, 150))

// GET /api/relationships?personId=
export async function listRelationships(personId: string): Promise<Relationship[]> {
  await delay()
  return db.relationships.filter((r) => r.personAId === personId || r.personBId === personId)
}

// POST /api/relationships
export async function createRelationship(input: Omit<Relationship, 'id'>): Promise<Relationship> {
  await delay()
  if (input.personAId === input.personBId) {
    throw new ApiError('INVALID_RELATIONSHIP', 'A person cannot be related to themselves')
  }
  const duplicate = db.relationships.find(
    (r) =>
      r.type === input.type &&
      ((r.personAId === input.personAId && r.personBId === input.personBId) ||
        (r.personAId === input.personBId && r.personBId === input.personAId)),
  )
  if (duplicate) return duplicate
  const relationship: Relationship = { id: uuid(), ...input }
  db.relationships.push(relationship)
  persist()
  return relationship
}

// PUT /api/relationships/{id}
export async function updateRelationship(
  id: string,
  patch: Partial<Omit<Relationship, 'id' | 'type' | 'personAId' | 'personBId'>>,
): Promise<Relationship> {
  await delay()
  const relationship = db.relationships.find((r) => r.id === id)
  if (!relationship) throw new ApiError('RELATIONSHIP_NOT_FOUND', `Relationship ${id} not found`)
  Object.assign(relationship, patch)
  persist()
  return relationship
}

// DELETE /api/relationships/{id}
export async function deleteRelationship(id: string): Promise<void> {
  await delay()
  const exists = db.relationships.some((r) => r.id === id)
  if (!exists) throw new ApiError('RELATIONSHIP_NOT_FOUND', `Relationship ${id} not found`)
  db.relationships = db.relationships.filter((r) => r.id !== id)
  persist()
}
