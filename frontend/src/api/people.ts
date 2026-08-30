import { v4 as uuid } from 'uuid'
import { db, persist } from './db'
import { ApiError } from './errors'
import type { Person, PersonInput, Relatives } from '../types/domain'

const LATENCY_MS = 150
const delay = () => new Promise((r) => setTimeout(r, LATENCY_MS))

function requirePerson(id: string): Person {
  const person = db.persons.find((p) => p.id === id)
  if (!person) throw new ApiError('PERSON_NOT_FOUND', `Person ${id} not found`)
  return person
}

// GET /api/persons?search=
export async function listPersons(search = ''): Promise<Person[]> {
  await delay()
  const q = search.trim().toLowerCase()
  if (!q) return [...db.persons]
  return db.persons.filter((p) =>
    `${p.lastName} ${p.firstName} ${p.middleName ?? ''}`.toLowerCase().includes(q),
  )
}

// GET /api/persons/{id}
export async function getPerson(id: string): Promise<Person> {
  await delay()
  return { ...requirePerson(id) }
}

// POST /api/persons
export async function createPerson(input: PersonInput): Promise<Person> {
  await delay()
  const person: Person = { id: uuid(), ...input }
  db.persons.push(person)
  persist()
  return { ...person }
}

// PUT /api/persons/{id}
export async function updatePerson(id: string, input: Partial<PersonInput>): Promise<Person> {
  await delay()
  const person = requirePerson(id)
  Object.assign(person, input)
  persist()
  return { ...person }
}

// DELETE /api/persons/{id} — cascades to relationships and photo tags
export async function deletePerson(id: string): Promise<void> {
  await delay()
  requirePerson(id)
  db.persons = db.persons.filter((p) => p.id !== id)
  db.relationships = db.relationships.filter((r) => r.personAId !== id && r.personBId !== id)
  db.photos.forEach((photo) => {
    photo.personIds = photo.personIds.filter((pid) => pid !== id)
  })
  db.photos = db.photos.filter((photo) => photo.personIds.length > 0)
  persist()
}

// GET /api/persons/{id}/relatives
export async function getRelatives(id: string): Promise<Relatives> {
  await delay()
  requirePerson(id)
  const byId = (pid: string) => db.persons.find((p) => p.id === pid)!

  const parents = db.relationships
    .filter((r) => r.type === 'PARENT_CHILD' && r.personBId === id)
    .map((r) => byId(r.personAId))

  const children = db.relationships
    .filter((r) => r.type === 'PARENT_CHILD' && r.personAId === id)
    .map((r) => byId(r.personBId))

  const spouses = db.relationships
    .filter((r) => r.type === 'SPOUSE' && (r.personAId === id || r.personBId === id))
    .map((r) => byId(r.personAId === id ? r.personBId : r.personAId))

  const siblings = db.relationships
    .filter((r) => r.type === 'SIBLING' && (r.personAId === id || r.personBId === id))
    .map((r) => byId(r.personAId === id ? r.personBId : r.personAId))

  return { parents, children, spouses, siblings }
}
