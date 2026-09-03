import { db } from './db'
import type { Person, TreeGraph, TreeNode } from '../types/domain'

const delay = () => new Promise((r) => setTimeout(r, 150))

function toNode(person: Person): TreeNode {
  const photo = person.primaryPhotoId ? db.photos.find((p) => p.id === person.primaryPhotoId) : undefined
  return {
    id: person.id,
    firstName: person.firstName,
    lastName: person.lastName,
    middleName: person.middleName,
    gender: person.gender,
    birthDate: person.birthDate,
    deathDate: person.deathDate,
    thumbnailUrl: photo?.thumbnailUrl,
  }
}

// GET /api/tree
export async function getTree(): Promise<TreeGraph> {
  await delay()
  return {
    nodes: db.persons.map(toNode),
    edges: [...db.relationships],
  }
}

// GET /api/tree/{personId}?up=&down=
export async function getSubtree(personId: string, up: number, down: number): Promise<TreeGraph> {
  await delay()
  const idsInScope = new Set<string>([personId])

  let frontier = [personId]
  for (let i = 0; i < up; i++) {
    const parents = db.relationships
      .filter((r) => r.type === 'PARENT_CHILD' && frontier.includes(r.personBId))
      .map((r) => r.personAId)
    if (parents.length === 0) break
    parents.forEach((id) => idsInScope.add(id))
    frontier = parents
  }

  frontier = [personId]
  for (let i = 0; i < down; i++) {
    const children = db.relationships
      .filter((r) => r.type === 'PARENT_CHILD' && frontier.includes(r.personAId))
      .map((r) => r.personBId)
    if (children.length === 0) break
    children.forEach((id) => idsInScope.add(id))
    frontier = children
  }

  // Pull in spouses/siblings of anyone already in scope so couples don't render half-cut.
  db.relationships
    .filter((r) => r.type !== 'PARENT_CHILD')
    .forEach((r) => {
      if (idsInScope.has(r.personAId)) idsInScope.add(r.personBId)
      if (idsInScope.has(r.personBId)) idsInScope.add(r.personAId)
    })

  const nodes = db.persons.filter((p) => idsInScope.has(p.id)).map(toNode)
  const edges = db.relationships.filter((r) => idsInScope.has(r.personAId) && idsInScope.has(r.personBId))
  return { nodes, edges }
}
