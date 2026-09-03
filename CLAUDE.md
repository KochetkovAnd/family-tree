# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

Frontend is scaffolded and functional against a mock backend (see below).
`backend/` does not exist yet — it's owned and written by the user separately.

## Commands

Run from `frontend/`:

```
npm run dev      # start Vite dev server (http://localhost:5173)
npm run build    # type-check (vue-tsc -b) then production build
npm run preview  # serve the production build locally
```

There is no test suite yet. No lint script is configured.

## Division of ownership

- **Backend** (Java + Spring, PostgreSQL): owned and written by the user. Claude
  should not write backend code unless explicitly asked — its role here is to stay
  contract-compatible with it.
- **Frontend** (Vue 3 + TypeScript + Vite): owned and written by Claude, lives in
  `frontend/`.
- `docs/` — shared docs, including the API contract.
- `backend/` doesn't exist yet; when it does, `docs/api.md` is what it must match.

## API contract

[docs/api.md](docs/api.md) is the source of truth for the REST API between frontend
and backend — entity shapes (`Person`, `Relationship`) and every URL. Keep it in
sync with whichever side changes first; don't let the contract drift silently out
of either codebase.

Key design decisions baked into the contract:
- No auth / multi-user model at this stage — one shared tree, no login.
- `SIBLING` is a real, explicitly stored relationship type alongside
  `PARENT_CHILD` and `SPOUSE` — not purely derived from shared parents, since a
  sibling link can be known before the shared parent is entered.
- A person's photos are a separate `Photo` entity, many-to-many with `Person`
  (one photo can tag several people) — not a field on `Person`. The node's
  displayed photo is `Person.primaryPhotoId`, which must point at one of that
  person's tagged photos.
- Tree data is served two ways: `/api/tree` (whole graph, for small trees) and
  `/api/tree/{personId}?up=&down=` (bounded subgraph, for large trees needing
  lazy loading) — the frontend should be able to work against either.
- Graph endpoints return a lightweight `TreeNode` projection (name, dates,
  `thumbnailUrl` string), never the full `Person` — the full record is fetched
  separately only when a person's edit modal opens.

## Frontend architecture

- Vue 3 + TypeScript, Vite-based.
- Tree/graph rendering uses `@vue-flow/core` (+ `@vue-flow/background`,
  `@vue-flow/controls`). Custom node type `person` is `src/components/PersonNode.vue`,
  registered via the `#node-person` slot in `src/components/FamilyTree.vue`.
- No client-side auth handling needed yet given the no-auth decision above.

### Mock backend (`src/api/`)

There is no real backend yet, so `src/api/` implements the full contract from
`docs/api.md` in-memory, persisted to `localStorage` (key `family-tree-mock-db-v2`,
seeded on first load — see `src/api/db.ts`). Every function signature mirrors an
endpoint 1:1 (e.g. `getTree()` ≈ `GET /api/tree`, `createRelationship(...)` ≈
`POST /api/relationships`), so **when the real Spring backend exists, only the
files under `src/api/` need to change** (to issue `fetch()` calls instead of
touching `db.ts`) — components and composables should never need to change.
`resetDb()` wipes localStorage and reseeds; wired to the "Сбросить демо-данные"
toolbar button for manual testing.

### Tree layout (`src/composables/useTreeLayout.ts`)

`@vue-flow/core` does not do graph layout — it only renders nodes at positions
you give it. `layoutTree()` computes a generation-row layout from the raw
`TreeGraph` (nodes + edges): depth-per-person via longest-path relaxation over
`PARENT_CHILD` edges, with spouse AND sibling depths equalized in the same
relaxation loop (otherwise someone marrying in — or a known sibling — with no
parents on record defaults to depth 0 and drags their whole row back to the
top). Spouses are grouped into a single "unit" so they render adjacently; a
unit's horizontal position is the average of its parents' unit positions from
the row above. Within a mixed-gender couple the man always ends up on the
left (`orderCouple()`) — same-gender couples keep whatever order they were
first encountered in, since there's no equivalent convention to apply there.
This is a from-scratch heuristic tuned for family trees, not a generic
graph-layout algorithm — don't expect it to handle arbitrary cyclic graphs.

**Parent/child edges are NOT drawn directly between parent and child.** Every
distinct parent-set (i.e. every couple, or lone parent, that has children) gets
a synthetic `union-<sortedParentIds>` node — a small dot rendered by
`UnionNode.vue`, positioned halfway between the parent row and the child row.
Parents connect down into it (`kind: 'parent-union'`), and it fans out to every
child (`kind: 'union-child'`). This is the standard genogram "family bus"
pattern; drawing one line per parent per child instead produces constant X
crossings once there are two parents and multiple children, which read as
cluttered. `layoutTree()` returns `unions` as a third array alongside `nodes`/
`edges` — `FamilyTree.vue` renders them as vue-flow nodes of type `union`
(not clickable — `onNodeClick` in `FamilyTree.vue` checks `node.type ===
'person'` before opening the edit modal).

For a couple (2 recorded parents), their two `parent-union` lines start from
the side facing each other (right side of the left parent, left side of the
right one) — the same side their marriage line occupies — rather than from
the bottom of the card, via dedicated `r-source-union`/`l-source-union`
handles in `PersonNode.vue` positioned a fixed `10px` below the plain
`l-source`/`r-source` pair the marriage line itself uses. That offset is what
keeps the two lines visually distinct (marriage line, then the union line
just under it) instead of one drawing directly over the other — don't collapse
them back onto the same handle. `l`/`r`-positioned handles sit at the node's
vertical center via CSS regardless of rendered height, so unlike a bottom
handle, this attach point doesn't jump when the LOD photo toggle changes card
height. A lone parent has no "facing" side and keeps using the bottom (`b`)
handle instead.

Because a couple's union dot sits in the horizontal gap between their two
cards (`COUPLE_GAP`), not below either one, it can — and does — sit much
closer to the parent row than a lone parent's (`UNION_OFFSET_Y_COUPLE = 90` vs
`UNION_OFFSET_Y_LONE = 150`): it never needs to clear a card's bottom edge the
way the lone-parent case does, since horizontally it's never under a card to
begin with. Don't unify these two constants without re-checking that a couple's dot still
can't collide with either card at high zoom — an earlier version pegged both
to the same offset and the dot ended up overlapping the parent card at high
zoom once the photo LOD variant (taller than the offset assumed) rendered.

`FamilyTree.vue` still sets the marriage line's `zIndex` above the
parent-union/union-child default — harmless now that the two rarely share a
pixel, but there's no reason to remove it either.

An explicit `SIBLING` relationship is only rendered as its own line when the
two people do NOT already share the exact same recorded parent set — full
siblings are already visibly grouped by sharing one union dot, so a second
line would just be redundant clutter repeating what the bus line already
shows. When it IS drawn (e.g. `natalia`/`irina` in the seed data — siblings
with no parents recorded), it routes through top handles (`ts` source / `t`
target — see `PersonNode.vue`) with a `smoothstep` edge, arcing over the tops
of the row rather than cutting through node bodies as a straight line would
if the two aren't adjacent. Don't reintroduce direct `personAId`→`personBId`
sibling edges through the middle of the row; that was the "unclear" complaint
this replaced. This suppression logic lives in `layoutTree()` (the
`groupKeyOf` comparison) — it is the frontend's own display simplification,
not a statement that the underlying data is redundant (see `docs/api.md` on
why `SIBLING` stays its own stored relationship server-side regardless).

Edge routing for the remaining kinds: `SPOUSE` picks left/right handles based
on which node the layout placed further left, computed per-edge rather than
assumed from `personAId`/`personBId` order.

### Known workaround: `as unknown as Node[]` / `Edge[]` in FamilyTree.vue

Assigning the mapped node/edge arrays directly to `nodes.value`/`edges.value`
hits a real `vue-tsc` bug (`TS2589: Type instantiation is excessively deep`)
against `@vue-flow/core`'s generic `Node`/`Edge` types. The `as unknown as
Node[]` casts are there to route around that, not sloppiness — don't "clean
them up" without confirming `npm run build` still passes without them.

### Zoom-dependent level of detail

At low zoom a node shows only name + birth/death years — no image element is
mounted at all. Past a zoom threshold the node switches to a variant that
mounts an `<img>` for `thumbnailUrl`; the browser then only fetches images for
nodes actually rendered at that size, which is what keeps a large tree cheap
(no manual viewport-based fetch logic needed on top of that). Load full-size
`Photo.url` images only inside the person edit modal or its photo gallery,
never on the graph itself.

Gender is therefore also carried as its own `TreeNode.gender` field rather
than only implied by photo color — a colored left border on `PersonNode.vue`
(`genderColor()` in `src/api/avatar.ts`, shared with the placeholder-avatar
generator so the two can't drift apart) stays visible at every zoom level,
including the low-zoom/no-photo state.

### Last-name highlight

The toolbar's `<select>` in `FamilyTree.vue` lists surname groups, not raw
`lastName` strings — Russian surnames decline by gender (Иванов/Иванова,
Достоевский/Достоевская), and `surnameKey()` (`src/utils/surname.ts`)
normalizes both forms to the same key so a couple/family doesn't get split
into two dropdown entries. Groups (recomputed in `loadTree()` off
`laidOut.nodes`, not fetched separately) are labeled with every literal
variant seen, joined by `/` (e.g. "Иванов / Иванова"). Picking one doesn't
refetch or re-layout anything — it just sets `highlightedKey`, matched via
`surnameKey(node.lastName) === highlightedKey` inline in the `#node-person`
slot, which flows into `PersonNode`'s `highlighted`/`dimmed` props. Matching
nodes get a gold outline, everyone else fades to low opacity; clearing the
select (empty string) turns both off. `surnameKey()` is a heuristic (strips
the feminine `-а`/`-ая`/`-ская` endings), not a full morphology engine — an
unrecognized ending just passes through unchanged, which is safe (worst case
it stays its own single-item group instead of merging).

### Person edit modal

Opens on clicking a node. Two concerns:

1. **Person fields** — a plain form over every `Person` field from the
   contract, saved via `PUT /api/persons/{id}`.
2. **Relationships** — a single table (`relationRows` in `PersonEditModal.vue`,
   flattened from `getRelatives()`'s parents/children/spouses/siblings groups):
   person on the left, relation label on the right, remove control (confirms,
   then `DELETE /api/relationships/{id}`) on the end. One "+ Добавить" button
   next to the "Родственные связи" heading opens `RelationAddForm.vue`, which
   itself now owns the relation-kind choice (a `<select>` — Родитель / Ребёнок
   / Супруг(а) / Брат/сестра, defaulting to Ребёнок since most adds to a fresh
   tree are new children) instead of that being picked via which of four
   separate buttons was clicked. The direction/type still follow from that
   choice, not from the picked person. From there: either search an existing
   person (`GET /api/persons?search=`) or, if no match, quick-create one
   inline (name fields only) before the relationship is created via
   `POST /api/relationships`.
