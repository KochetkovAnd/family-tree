// Shapes mirror docs/api.md exactly, so swapping the mock API for the real
// backend later is a matter of replacing src/api/*, not touching components.

export type Gender = 'MALE' | 'FEMALE'

export interface Person {
  id: string
  firstName: string
  lastName: string
  middleName?: string
  maidenName?: string
  gender: Gender
  birthDate?: string // ISO YYYY-MM-DD
  birthDateApprox?: boolean
  deathDate?: string
  deathDateApprox?: boolean
  birthPlace?: string
  deathPlace?: string
  primaryPhotoId?: string
  notes?: string
}

export type PersonInput = Omit<Person, 'id'>

export interface TreeNode {
  id: string
  firstName: string
  lastName: string
  middleName?: string
  birthDate?: string
  deathDate?: string
  thumbnailUrl?: string
}

export type RelationshipType = 'PARENT_CHILD' | 'SPOUSE' | 'SIBLING'
export type SpouseStatus = 'MARRIED' | 'DIVORCED' | 'WIDOWED' | 'PARTNERSHIP'

export interface Relationship {
  id: string
  type: RelationshipType
  personAId: string
  personBId: string
  marriageDate?: string
  divorceDate?: string
  status?: SpouseStatus
}

export interface Photo {
  id: string
  url: string
  thumbnailUrl: string
  personIds: string[]
  takenDate?: string
  caption?: string
}

export interface Relatives {
  parents: Person[]
  children: Person[]
  spouses: Person[]
  siblings: Person[]
}

export interface TreeGraph {
  nodes: TreeNode[]
  edges: Relationship[]
}
