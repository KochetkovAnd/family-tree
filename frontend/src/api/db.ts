import { v4 as uuid } from 'uuid'
import type { Person, Relationship, Photo } from '../types/domain'
import { generateAvatarDataUrl, initialsOf } from './avatar'

// In-memory store standing in for the Postgres-backed Spring API described in
// docs/api.md, persisted to localStorage so a page refresh doesn't lose edits.
// Replace src/api/*.ts with real HTTP calls once the backend exists — nothing
// outside this folder should need to change (see PersonInput/TreeGraph etc.
// in src/types/domain.ts, which mirror the contract).

interface Db {
  persons: Person[]
  relationships: Relationship[]
  photos: Photo[]
}

const STORAGE_KEY = 'family-tree-mock-db-v2'

function seed(): Db {
  const persons: Person[] = [
    { id: 'ivan', firstName: 'Иван', lastName: 'Петров', middleName: 'Сергеевич', gender: 'MALE', birthDate: '1945-03-12', birthPlace: 'Москва' },
    { id: 'maria', firstName: 'Мария', lastName: 'Петрова', middleName: 'Фёдоровна', maidenName: 'Волкова', gender: 'FEMALE', birthDate: '1948-07-02', birthPlace: 'Тверь' },
    { id: 'sergey', firstName: 'Сергей', lastName: 'Иванов', middleName: 'Иванович', gender: 'MALE', birthDate: '1970-01-20', birthPlace: 'Москва' },
    { id: 'olga', firstName: 'Ольга', lastName: 'Кузнецова', middleName: 'Ивановна', maidenName: 'Иванова', gender: 'FEMALE', birthDate: '1973-05-30', birthPlace: 'Москва' },
    { id: 'natalia', firstName: 'Наталья', lastName: 'Иванова', middleName: 'Петровна', maidenName: 'Смирнова', gender: 'FEMALE', birthDate: '1972-09-14', birthPlace: 'Рязань' },
    { id: 'dmitry', firstName: 'Дмитрий', lastName: 'Кузнецов', middleName: 'Олегович', gender: 'MALE', birthDate: '1971-11-03', birthPlace: 'Москва' },
    { id: 'andrey', firstName: 'Андрей', lastName: 'Иванов', middleName: 'Сергеевич', gender: 'MALE', birthDate: '1995-04-18', birthPlace: 'Москва' },
    { id: 'ekaterina', firstName: 'Екатерина', lastName: 'Иванова', middleName: 'Сергеевна', gender: 'FEMALE', birthDate: '1998-12-01', birthPlace: 'Москва' },
    { id: 'pavel', firstName: 'Павел', lastName: 'Кузнецов', middleName: 'Дмитриевич', gender: 'MALE', birthDate: '1999-06-25', birthPlace: 'Москва' },
    // No recorded parents on purpose: demonstrates a SIBLING link that isn't
    // implied by a shared parent union (see docs/api.md on why SIBLING is
    // its own stored relationship rather than always derived).
    { id: 'irina', firstName: 'Ирина', lastName: 'Смирнова', middleName: 'Петровна', gender: 'FEMALE', birthDate: '1975-02-08', birthPlace: 'Рязань' },
  ]

  const photos: Photo[] = persons.map((p) => {
    const url = generateAvatarDataUrl(initialsOf(p.firstName, p.lastName), p.gender)
    return { id: `photo-${p.id}`, url, thumbnailUrl: url, personIds: [p.id], caption: 'Основное фото' }
  })
  persons.forEach((p) => { p.primaryPhotoId = `photo-${p.id}` })

  const rel = (type: Relationship['type'], a: string, b: string, extra: Partial<Relationship> = {}): Relationship => ({
    id: uuid(), type, personAId: a, personBId: b, ...extra,
  })

  const relationships: Relationship[] = [
    rel('SPOUSE', 'ivan', 'maria', { status: 'MARRIED', marriageDate: '1968-06-10' }),
    rel('PARENT_CHILD', 'ivan', 'sergey'),
    rel('PARENT_CHILD', 'maria', 'sergey'),
    rel('PARENT_CHILD', 'ivan', 'olga'),
    rel('PARENT_CHILD', 'maria', 'olga'),
    rel('SIBLING', 'sergey', 'olga'),
    rel('SPOUSE', 'sergey', 'natalia', { status: 'MARRIED', marriageDate: '1993-08-21' }),
    rel('SPOUSE', 'olga', 'dmitry', { status: 'MARRIED', marriageDate: '1996-02-14' }),
    rel('PARENT_CHILD', 'sergey', 'andrey'),
    rel('PARENT_CHILD', 'natalia', 'andrey'),
    rel('PARENT_CHILD', 'sergey', 'ekaterina'),
    rel('PARENT_CHILD', 'natalia', 'ekaterina'),
    rel('SIBLING', 'andrey', 'ekaterina'),
    rel('PARENT_CHILD', 'olga', 'pavel'),
    rel('PARENT_CHILD', 'dmitry', 'pavel'),
    rel('SIBLING', 'natalia', 'irina'),
  ]

  return { persons, relationships, photos }
}

function load(): Db {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    const fresh = seed()
    save(fresh)
    return fresh
  }
  try {
    return JSON.parse(raw) as Db
  } catch {
    const fresh = seed()
    save(fresh)
    return fresh
  }
}

function save(db: Db) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
}

export const db = load()

export function persist() {
  save(db)
}

export function resetDb() {
  localStorage.removeItem(STORAGE_KEY)
  const fresh = seed()
  db.persons = fresh.persons
  db.relationships = fresh.relationships
  db.photos = fresh.photos
  save(db)
}
