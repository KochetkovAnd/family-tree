import type { TreeGraph, TreeNode } from '../types/domain'

// Generation-row layout for a family DAG: not a generic graph-layout algorithm,
// tailored to what family trees look like — spouses sit side by side, children
// are centered under their parents' horizontal position on the row below.
//
// Parent/child connections are drawn as a genogram-style "family bus": each
// distinct parent-set gets one small union dot placed between the parent row
// and the child row, parents connect down into it, and it fans out to every
// child. That replaces what would otherwise be one direct diagonal line per
// parent per child — with two parents and several children those diagonals
// cross each other constantly, which is the "overloaded" look this avoids.
// A side benefit: full siblings sharing that dot are already visibly grouped,
// so an explicit SIBLING relationship is only drawn on its own when it is NOT
// already implied by a shared union (e.g. a known sibling whose parents
// haven't been entered yet) — otherwise it would just be a second, redundant
// line fighting the bus line for the same information.

const NODE_WIDTH = 170
const COUPLE_GAP = 24
const UNIT_GAP = 70
const ROW_HEIGHT = 260
const UNION_DOT_SIZE = 10
// A lone parent's union dot sits below their card, so its offset has to clear
// the card's tallest possible rendering (~122px at zoom 1, photo shown) with
// room to spare, or at high zoom the dot overlaps the card's bottom edge.
const UNION_OFFSET_Y_LONE = 150
// A couple's union dot instead sits in the horizontal gap BETWEEN the two
// cards (see COUPLE_GAP) — it never overlaps either card regardless of card
// height, so it can sit much closer to the parent row, right under where the
// marriage line is, matching the l-source-union/r-source-union handle offset
// in PersonNode.vue.
const UNION_OFFSET_Y_COUPLE = 90

export interface LaidOutNode {
  id: string
  position: { x: number; y: number }
  data: TreeNode
}

export interface LaidOutUnion {
  id: string
  position: { x: number; y: number }
}

export type EdgeKind = 'parent-union' | 'union-child' | 'spouse' | 'sibling'

export interface LaidOutEdge {
  id: string
  source: string
  target: string
  sourceHandle: string
  targetHandle: string
  kind: EdgeKind
}

export function layoutTree(
  graph: TreeGraph,
): { nodes: LaidOutNode[]; unions: LaidOutUnion[]; edges: LaidOutEdge[] } {
  const { nodes, edges } = graph
  const nodeById = new Map(nodes.map((n) => [n.id, n]))
  const parentEdges = edges.filter((e) => e.type === 'PARENT_CHILD')
  const spouseEdges = edges.filter((e) => e.type === 'SPOUSE')
  const siblingEdges = edges.filter((e) => e.type === 'SIBLING')

  const parentsOf = new Map<string, string[]>()
  parentEdges.forEach((e) => {
    if (!nodeById.has(e.personAId) || !nodeById.has(e.personBId)) return
    parentsOf.set(e.personBId, [...(parentsOf.get(e.personBId) ?? []), e.personAId])
  })

  // Longest-path depth: a child sits one row below its deepest parent. Spouse
  // AND sibling depths are then equalized (someone marrying in — or a known
  // sibling — with no parents on record otherwise defaults to depth 0 and
  // drags their row back up to the top), relaxed together with the parent
  // rule since any one of the three can unlock another.
  const depth = new Map<string, number>(nodes.map((n) => [n.id, 0]))
  for (let i = 0; i <= nodes.length + edges.length; i++) {
    let changed = false
    for (const e of parentEdges) {
      if (!nodeById.has(e.personAId) || !nodeById.has(e.personBId)) continue
      const candidate = (depth.get(e.personAId) ?? 0) + 1
      if (candidate > (depth.get(e.personBId) ?? 0)) {
        depth.set(e.personBId, candidate)
        changed = true
      }
    }
    for (const e of [...spouseEdges, ...siblingEdges]) {
      if (!nodeById.has(e.personAId) || !nodeById.has(e.personBId)) continue
      const shared = Math.max(depth.get(e.personAId) ?? 0, depth.get(e.personBId) ?? 0)
      if (shared > (depth.get(e.personAId) ?? 0)) { depth.set(e.personAId, shared); changed = true }
      if (shared > (depth.get(e.personBId) ?? 0)) { depth.set(e.personBId, shared); changed = true }
    }
    if (!changed) break
  }

  // Pair each person with (at most) one spouse into a visual "unit" so couples
  // are placed as a single block instead of independently ordered.
  const spouseOf = new Map<string, string>()
  spouseEdges.forEach((e) => {
    if (!nodeById.has(e.personAId) || !nodeById.has(e.personBId)) return
    if (!spouseOf.has(e.personAId) && !spouseOf.has(e.personBId)) {
      spouseOf.set(e.personAId, e.personBId)
      spouseOf.set(e.personBId, e.personAId)
    }
  })

  interface Unit { id: string; memberIds: string[]; depth: number }
  const unitOfPerson = new Map<string, string>()
  const units: Unit[] = []
  for (const node of nodes) {
    if (unitOfPerson.has(node.id)) continue
    const spouseId = spouseOf.get(node.id)
    const memberIds = spouseId && !unitOfPerson.has(spouseId) ? [node.id, spouseId] : [node.id]
    const unitId = `unit-${node.id}`
    memberIds.forEach((id) => unitOfPerson.set(id, unitId))
    units.push({ id: unitId, memberIds, depth: Math.min(...memberIds.map((id) => depth.get(id) ?? 0)) })
  }

  const rows = new Map<number, Unit[]>()
  units.forEach((u) => rows.set(u.depth, [...(rows.get(u.depth) ?? []), u]))
  const sortedDepths = [...rows.keys()].sort((a, b) => a - b)

  const unitCenterX = new Map<string, number>()
  const positions = new Map<string, { x: number; y: number }>()

  sortedDepths.forEach((d, rowIndex) => {
    const rowUnits = rows.get(d)!
    const anchor = (unit: Unit) => {
      const parentCenters = unit.memberIds
        .flatMap((id) => parentsOf.get(id) ?? [])
        .map((pid) => unitCenterX.get(unitOfPerson.get(pid) ?? ''))
        .filter((x): x is number => x !== undefined)
      if (parentCenters.length > 0) return parentCenters.reduce((a, b) => a + b, 0) / parentCenters.length
      return Number.POSITIVE_INFINITY // no parents in scope: push after anchored units, keep stable order
    }

    const originalOrder = new Map(rowUnits.map((u, i) => [u.id, i]))
    const ordered = [...rowUnits].sort((a, b) => {
      const anchorDiff = anchor(a) - anchor(b)
      if (Number.isFinite(anchorDiff)) return anchorDiff
      // both (or one) unanchored: fall back to original array order
      return originalOrder.get(a.id)! - originalOrder.get(b.id)!
    })

    let cursor = 0
    ordered.forEach((unit) => {
      const width = unit.memberIds.length === 2 ? NODE_WIDTH * 2 + COUPLE_GAP : NODE_WIDTH
      const y = rowIndex * ROW_HEIGHT
      unit.memberIds.forEach((id, idx) => {
        positions.set(id, { x: cursor + idx * (NODE_WIDTH + COUPLE_GAP), y })
      })
      unitCenterX.set(unit.id, cursor + width / 2)
      cursor += width + UNIT_GAP
    })
  })

  const laidOutNodes: LaidOutNode[] = nodes.map((n) => ({
    id: n.id,
    position: positions.get(n.id) ?? { x: 0, y: 0 },
    data: n,
  }))

  // Group children by their exact parent set — each group becomes one union dot.
  const groupKeyOf = new Map<string, string>() // childId -> key
  const groups = new Map<string, string[]>() // key -> parentIds
  parentsOf.forEach((parentIds, childId) => {
    const key = [...parentIds].sort().join('|')
    groupKeyOf.set(childId, key)
    if (!groups.has(key)) groups.set(key, [...parentIds])
  })

  const unions: LaidOutUnion[] = []
  const edgesOut: LaidOutEdge[] = []

  groups.forEach((parentIds, key) => {
    const parentPositions = parentIds
      .map((id) => positions.get(id))
      .filter((p): p is { x: number; y: number } => !!p)
    if (parentPositions.length === 0) return

    const isCouple = parentPositions.length === 2
    const parentRowY = Math.max(...parentPositions.map((p) => p.y))
    const x = parentPositions.reduce((sum, p) => sum + p.x + NODE_WIDTH / 2, 0) / parentPositions.length
    const y = parentRowY + (isCouple ? UNION_OFFSET_Y_COUPLE : UNION_OFFSET_Y_LONE)

    const unionId = `union-${key}`
    unions.push({ id: unionId, position: { x: x - UNION_DOT_SIZE / 2, y: y - UNION_DOT_SIZE / 2 } })

    // A couple's own lines into the union start from the side facing each
    // other (the same side their marriage line already occupies) rather than
    // from the bottom of the card, a bit below the marriage line's own attach
    // point so the two read as distinct lines instead of one drawn over the
    // other. Left/right handles sit at the node's vertical center via CSS
    // regardless of rendered height, so — unlike a bottom handle — the attach
    // point doesn't shift when the taller, photo LOD variant is shown. A lone
    // parent has no "facing" side, so it keeps using bottom.
    const sortedParentIds = [...parentIds].sort(
      (a, b) => (positions.get(a)?.x ?? 0) - (positions.get(b)?.x ?? 0),
    )
    sortedParentIds.forEach((parentId, index) => {
      const sourceHandle = isCouple
        ? index === 0
          ? 'r-source-union'
          : 'l-source-union'
        : 'b'
      edgesOut.push({
        id: `${unionId}-in-${parentId}`,
        source: parentId,
        target: unionId,
        sourceHandle,
        targetHandle: 't',
        kind: 'parent-union',
      })
    })
  })

  parentsOf.forEach((_parentIds, childId) => {
    const key = groupKeyOf.get(childId)!
    edgesOut.push({
      id: `union-${key}-out-${childId}`,
      source: `union-${key}`,
      target: childId,
      sourceHandle: 'b',
      targetHandle: 't',
      kind: 'union-child',
    })
  })

  spouseEdges
    .filter((e) => nodeById.has(e.personAId) && nodeById.has(e.personBId))
    .forEach((e) => {
      const aLeft = (positions.get(e.personAId)?.x ?? 0) <= (positions.get(e.personBId)?.x ?? 0)
      edgesOut.push({
        id: e.id,
        source: e.personAId,
        target: e.personBId,
        sourceHandle: aLeft ? 'r-source' : 'l-source',
        targetHandle: aLeft ? 'l-target' : 'r-target',
        kind: 'spouse',
      })
    })

  // A sibling edge only earns its own line when the bus doesn't already show
  // it — i.e. the two don't share the exact same recorded parent set. It's
  // routed as an overhead arc (top handles) rather than straight through the
  // row, since the two siblings are rarely adjacent and a mid-height line
  // would cut across whichever nodes happen to sit between them.
  siblingEdges
    .filter((e) => nodeById.has(e.personAId) && nodeById.has(e.personBId))
    .filter((e) => {
      const keyA = groupKeyOf.get(e.personAId)
      const keyB = groupKeyOf.get(e.personBId)
      return !keyA || !keyB || keyA !== keyB
    })
    .forEach((e) => {
      edgesOut.push({
        id: e.id,
        source: e.personAId,
        target: e.personBId,
        sourceHandle: 'ts',
        targetHandle: 't',
        kind: 'sibling',
      })
    })

  return { nodes: laidOutNodes, unions, edges: edgesOut }
}
