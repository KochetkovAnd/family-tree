# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

Frontend is scaffolded and functional against a mock backend for tree data
(see below). `backend/` now exists but only implements auth (register/login,
JWT, bcrypt) — Person/Relationship/Photo/Tree-CRUD endpoints aren't built yet,
so the frontend's tree data still comes entirely from the in-memory mock.

## Commands

Frontend, run from `frontend/`:

```
npm run dev      # start Vite dev server (http://localhost:5173)
npm run build    # type-check (vue-tsc -b) then production build
npm run preview  # serve the production build locally
```

There is no test suite yet. No lint script is configured.

Backend, run from `backend/` (needs Postgres reachable per `application.yml`,
and a JDK 21 — `mvn` isn't on PATH in this environment; a wrapper build is
cached under `~/.m2/wrapper/dists/`, and `JAVA_HOME` needs to point at a JDK 21
such as `~/.jdks/corretto-21.*` — see IDE's configured SDK):

```
mvn compile          # compile
mvn spring-boot:run  # run — Tomcat on :8080
```

## Division of ownership

- **Backend** (Java + Spring, PostgreSQL): owned by the user; Claude writes
  backend code only when explicitly asked (auth was — see below). Otherwise
  its role is to stay contract-compatible with whatever the user builds.
- **Frontend** (Vue 3 + TypeScript + Vite): owned and written by Claude, lives in
  `frontend/`.
- `docs/` — shared docs, including the API contract.
- `docs/api.md` is what `backend/` must match as it grows past auth.

## API contract

[docs/api.md](docs/api.md) is the source of truth for the REST API between frontend
and backend — entity shapes (`Person`, `Relationship`) and every URL. Keep it in
sync with whichever side changes first; don't let the contract drift silently out
of either codebase.

Key design decisions baked into the contract:
- Auth is JWT-based (see "Authentication" below). A `Tree` is its own entity,
  deliberately not owned by a single user — access is granted via a separate
  `UserFamilyTree` join (a user has a *list* of trees they can reach), with no
  access-level granularity yet (a row = full access; that's a deferred decision).
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

## Authentication

The one part of the system that's real end-to-end (not mocked) — bcrypt/JWT
only mean something server-side, so this couldn't be faked in the frontend
mock like tree data is.

**Backend** (`backend/src/main/java/com/kochetkov/familytree/`):
- **Column naming convention**: every table's own id/audit columns are
  prefixed with that table's name — `users_id`, `users_created_at`,
  `family_tree_id`, `user_family_tree_deleted_by`, etc. (FK columns are the
  exception: `user_family_tree.user_id`/`tree_id` name what they point *to*,
  not the owning table — the more useful convention for join columns
  specifically). This is deliberate and applies to every future entity, not
  just the three that exist today — keep it going.
- `entity/User`, `entity/Tree`, `entity/UserFamilyTree` (the access join,
  renamed from `UserTreeAccess` — table is `user_family_tree`) extend
  `AuditEntity` → `BaseIdEntity`. Each concrete entity carries an
  `@AttributeOverrides` block remapping all 7 inherited columns (`id`,
  `createdAt`, `createdBy`, `updatedAt`, `updatedBy`, `deletedAt`,
  `deletedBy`) to its own prefixed names — copy that whole block (swapping
  the prefix) for any new entity, don't hand-pick a subset.
- **Per-entity sequences, and the one JPA wrinkle that comes with it**:
  `BaseIdEntity.id` carries `@GeneratedValue(generator =
  "entity_id_seq_generator")` — that generator *name* is a fixed literal
  every entity is stuck sharing, because JPA gives no way for a subclass to
  override an inherited `@GeneratedValue`. What actually differs per table is
  the real Postgres sequence: each concrete entity adds its own class-level
  `@SequenceGenerator(name = "entity_id_seq_generator", sequenceName =
  "<table>_id_seq", ...)` — Hibernate resolves the entity-local declaration
  for that entity specifically, so `users`/`family_tree`/`user_family_tree`
  each get their own independent sequence despite the shared generator-name
  token. **Any new entity that forgets this `@SequenceGenerator` annotation
  silently falls back to no working generator** — always add it.
- `createdAt`/`updatedAt` are `LocalDateTime` (not `Instant` — changed
  deliberately), populated by `@CreatedDate`/`@LastModifiedDate` via
  `@EnableJpaAuditing` on `FamilyTreeApplication`. `createdBy`/`updatedBy`
  (`@CreatedBy`/`@LastModifiedBy`) are populated by
  `security/SecurityAuditorAware` — the current authenticated principal's
  email, or the literal string `"system"` when there isn't one (e.g.
  self-registration, where the row being written is the not-yet-authenticated
  actor). `deletedAt`/`deletedBy` exist as plain nullable columns only —
  **nothing populates or filters on them yet**; an actual `DELETE` is still a
  real `DELETE`. Don't assume soft delete is implemented just because the
  columns exist.
- `security/JwtService` issues/parses tokens (`io.jsonwebtoken` / jjwt 0.12,
  HS256, secret + expiry from `app.jwt.*` in `application.yml`).
  `security/JwtAuthenticationFilter` reads `Authorization: Bearer <token>` and
  populates `SecurityContextHolder`. `security/SecurityConfig` wires it in
  stateless (`SessionCreationPolicy.STATELESS`, CSRF disabled — there's no
  cookie for CSRF to protect), permits `/api/auth/**`, requires auth on
  everything else, and answers unauthenticated requests with a JSON 401
  (`JsonAuthenticationEntryPoint`) matching the `{error, message}` shape the
  rest of the contract uses, instead of Spring Security's default blank 403.
- **`JwtAuthenticationFilter` is deliberately not a `@Component`** —
  `SecurityConfig` constructs it with `new` and wires it directly into the
  chain. Making an `OncePerRequestFilter` a top-level bean risks Spring Boot's
  embedded-container auto-configuration *also* registering it as a plain
  servlet filter outside Spring Security's own chain; keeping it a plain class
  sidesteps the question. Don't re-add `@Component` there without retesting a
  real protected endpoint end-to-end (see the next point for why that matters).
- Passwords are hashed with `BCryptPasswordEncoder` (`SecurityConfig` provides
  the bean) — `AuthService` never stores or compares raw passwords.
- **Testing auth locally: use an endpoint that actually exists.** Hitting a
  route with no `@RequestMapping` (e.g. `/api/persons`, which isn't built yet)
  404s, and Spring's internal forward-to-`/error` re-runs the security chain a
  second time — the response you get back reflects that second pass, not the
  first, which can look exactly like "valid tokens are being rejected" when
  they aren't. Test against `/api/auth/**` (open) or a route that's actually
  mapped, not a guessed one.
- `spring.jpa.hibernate.ddl-auto` is `validate` — Hibernate checks the schema
  matches the entities at startup and refuses to start on a mismatch, but
  never creates or alters anything itself. **There is no migration tool
  (Flyway/Liquibase) wired up** — this was a deliberate choice over adding one.
  Practical consequence: any entity change (new field, renamed/retyped column,
  a whole new entity) needs its DDL applied by hand against Postgres (`psql`,
  or any client) *before* the next `mvn spring-boot:run`, or startup fails
  validation. When a schema change is big enough that hand-editing the
  existing tables is more trouble than it's worth (e.g. the `users_id`-style
  rename this session), it's fine in dev — with no real data at stake — to
  just `DROP TABLE` the affected tables and let a one-off `ddl-auto: update`
  run recreate them from the entities, then switch back to `validate`.
  Likewise `app.jwt.secret` in that file is a checked-in
  placeholder, not something to deploy anywhere with.

**Frontend** (`frontend/src/auth/`): the one exception to "everything talks to
the mock" — `authApi.ts` calls the real backend directly
(`http://localhost:8080/api/auth/...`, hardcoded for now) with `fetch()`, not
through `src/api/`. `authState.ts` is a module-level reactive singleton (same
pattern as `src/api/db.ts` — no Pinia) holding the current `AuthSession`,
persisted to `localStorage` under `family-tree-auth-session`. `App.vue` gates
the whole app on `session` being set: `LoginPage.vue` (login/register toggle
in one form) when it isn't, `FamilyTree.vue` when it is. `FamilyTree.vue`'s
toolbar shows the current `displayName` and a "Выйти" button (`clearSession()`
from `authState.ts`) — logging out just clears the session ref/localStorage,
no backend call (there's no server-side session to invalidate; the JWT stays
valid until it expires).

Not wired up yet: `src/api/*` (tree data) doesn't send the `Authorization`
header from `authState.ts`'s `authHeader()` — it doesn't need to, since it
still talks to the in-memory mock, not the real backend. Once Person/
Relationship/Photo endpoints exist for real and `src/api/*` switches to
`fetch()`, that's the point to start attaching `authHeader()` to those calls
too.

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
