import { v4 as uuid } from 'uuid'
import { db, persist } from './db'
import { ApiError } from './errors'
import type { Photo } from '../types/domain'

const delay = () => new Promise((r) => setTimeout(r, 150))

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// GET /api/persons/{id}/photos
export async function getPersonPhotos(personId: string): Promise<Photo[]> {
  await delay()
  return db.photos.filter((p) => p.personIds.includes(personId))
}

// POST /api/photos (multipart in the real API; here we just take a File)
export async function uploadPhoto(
  file: File,
  personIds: string[],
  extra: { caption?: string; takenDate?: string } = {},
): Promise<Photo> {
  const dataUrl = await fileToDataUrl(file)
  await delay()
  const photo: Photo = { id: uuid(), url: dataUrl, thumbnailUrl: dataUrl, personIds: [...personIds], ...extra }
  db.photos.push(photo)
  persist()
  return photo
}

// PUT /api/photos/{id}
export async function updatePhoto(
  id: string,
  patch: Partial<Pick<Photo, 'caption' | 'takenDate' | 'personIds'>>,
): Promise<Photo> {
  await delay()
  const photo = db.photos.find((p) => p.id === id)
  if (!photo) throw new ApiError('PHOTO_NOT_FOUND', `Photo ${id} not found`)
  Object.assign(photo, patch)
  persist()
  return photo
}

// DELETE /api/photos/{id}
export async function deletePhoto(id: string): Promise<void> {
  await delay()
  db.photos = db.photos.filter((p) => p.id !== id)
  db.persons.forEach((person) => {
    if (person.primaryPhotoId === id) person.primaryPhotoId = undefined
  })
  persist()
}

// POST /api/persons/{id}/photos/{photoId}/untag
export async function untagPhoto(personId: string, photoId: string): Promise<void> {
  await delay()
  const photo = db.photos.find((p) => p.id === photoId)
  if (!photo) throw new ApiError('PHOTO_NOT_FOUND', `Photo ${photoId} not found`)
  photo.personIds = photo.personIds.filter((id) => id !== personId)
  const person = db.persons.find((p) => p.id === personId)
  if (person?.primaryPhotoId === photoId) person.primaryPhotoId = undefined
  if (photo.personIds.length === 0) db.photos = db.photos.filter((p) => p.id !== photoId)
  persist()
}

// PUT /api/persons/{id}/primary-photo
export async function setPrimaryPhoto(personId: string, photoId: string): Promise<void> {
  await delay()
  const person = db.persons.find((p) => p.id === personId)
  if (!person) throw new ApiError('PERSON_NOT_FOUND', `Person ${personId} not found`)
  const photo = db.photos.find((p) => p.id === photoId)
  if (!photo || !photo.personIds.includes(personId)) {
    throw new ApiError('PHOTO_NOT_IN_GALLERY', 'Photo must be tagged with this person first')
  }
  person.primaryPhotoId = photoId
  persist()
}
