# BTHG Rental Platform: full-stack architecture, security & readiness audit

*Discovery & Audit Report — No code changed*

An independent, evidence-based audit of the multi-agency car rental platform, conducted by two parallel specialist agents plus a third dispatched mid-investigation, then synthesized here. Every finding below is anchored to a real file and line.

- **Repositories audited:** 3
- **Method:** parallel independent investigation, zero cross-contamination
- **Changes made at the time this audit was written:** none

> **Status as committed to this repo:** this is a point-in-time snapshot — the findings below, and their file:line references, describe the codebase as it existed when the audit ran, not necessarily as it exists now. Two P0 items have since been addressed: the monorepo migration (§7, §8, §31 — PR #5) and the tenancy guard fix (§5, §6, §25 — PR #6, `docs/AUDIT.md` was added in a follow-up commit). Everything else in the P0–P3 lists (§25–§28) should be treated as still open unless a later commit or PR says otherwise. A live, formatted version of this report — with severity-colored finding cards and diagrams — is published at: https://claude.ai/code/artifact/ccdfedc3-9f3e-4101-8ae0-b71efa072d0e

---

## Contents

- 01. Executive Summary
- 02. Current System Overview
- 03. Architecture
- 04. Business & Domain Model
- 05. Multi-Agency / Tenant Architecture
- 06. Backend Audit
- 07. Frontend Audit
- 08. Frontend ↔ Backend Integration Audit
- 09. Database Audit
- 10. Supabase Migration Readiness
- 11. Authentication & Authorization Audit
- 12. Security Audit
- 13. Scalability Audit
- 14. Durability & Reliability Audit
- 15. Performance Audit
- 16. Code Redundancy Audit
- 17. Technical Debt Assessment
- 18. DevOps & Infrastructure Audit
- 19. GitHub & Versioning Workflow Audit
- 20. Testing Assessment
- 21. Observability Assessment
- 22. Maintainability Assessment
- 23. Critical Risks & Blockers
- 24. Recommended Target Architecture
- 25. P0 — Critical Improvements
- 26. P1 — High Priority Improvements
- 27. P2 — Medium Priority Improvements
- 28. P3 — Long-Term Improvements
- 29. Recommended Implementation Sequence
- 30. Final Architecture/Technical Assessment
- 31. Addendum — SDK Distribution for Web + Mobile, Without a GitHub Org

---

## 01. Executive Summary

*What this platform actually is, and the single fact that reshaped the whole audit.*

You asked for an audit of two repositories — a backend and a frontend. Partway through, evidence from the frontend agent's own investigation made it clear that the "backend" you named, `BTHG-Rental-Car`, is not what the frontend talks to. It is a **legacy, full-stack Next.js monolith** — complete with its own UI — that has not been pushed to in over six months. The frontend's dependency manifest points at a sibling folder, `BTHG-Rental-Car-2/packages/sdk`, which turned out to be a real, separate, private repository: a Turborepo monorepo containing a modern NestJS API, a Prisma/PostgreSQL package, and a published-but-effectively-unused SDK. I confirmed this against GitHub itself before proceeding, then added the third repository to scope with your explicit approval and ran a dedicated third audit against it.

So this report covers **three systems**, not two: the legacy monolith (dead code walking, but carrying a live secret exposure), the real backend (a genuinely well-architected NestJS API undermined by one severe tenancy bug and a missing migration history), and the frontend (a clean, small admin console that cannot currently be built at all, and which — this matters for planning — implements no customer-facing functionality whatsoever).

- **1** — Live secret leak in git history (legacy repo)
- **9** — Critical findings, real backend
- **10+** — Critical findings, legacy backend
- **0** — Tests exercising real backend code, either backend
- **0** — Secondary indexes, either database schema
- **3** — Repositories, not 2 — discovered mid-audit

**The headline finding is structural, not a single bug:** the real backend (`BTHG-Rental-Car-2`) is well engineered where it matters most — a global fail-closed auth guard, a JWT strategy that re-derives identity from the database on every request instead of trusting the token, a strict validation pipe that blocks the entire mass-assignment/privilege-escalation class, and correctly-paired role guards on every super-admin route. That is not beginner work. Sitting inside that same codebase is a data model that permits exactly **one admin per agency** (`Agency.responsibleId @unique`, no `AgencyUser.agencyId`), which forces admins with no agency to exist, which in turn causes five separate tenancy checks of the shape `if (userAgencyId && ...)` to silently no-op — turning a correct-looking guard into no guard at all for exactly the users the schema itself creates. One structural decision explains a cluster of "critical" findings that would otherwise look like carelessness. It isn't; it's one gap propagated by copy-paste, and it is fixable by fixing the copy-paste's source.

The frontend cannot presently be evaluated end-to-end because it cannot be installed: its SDK dependency is a `file:` path to a directory that does not exist under that name on disk. Once that is fixed, the frontend itself is above-average work — real caching discipline, real form validation, careful dark-mode handling — let down by a dashboard that fabricates its revenue numbers with `Math.random()` and by product incompleteness: **there is no code anywhere in this platform, in any of the three repositories, that lets a customer create a booking.** Every list-and-manage screen exists for admins and super admins. The client-facing rental experience does not exist yet. That is the most consequential product finding in this report and should shape the roadmap more than any individual bug.

Your specific question about the versioning workflow has a definite answer, detailed in §19: the GitHub Actions workflow itself is well built and uses no personal access token. The personal-account dependency is real but sits one layer up — in the **package's own name** (`@berthonge21/sdk`) and in GitHub Packages' requirement that private package consumers authenticate with a token scoped to the owning account. That is a naming and hosting decision, not a workflow bug, and it is straightforward to fix during an org migration.

> **Act on this before reading further**
>
> A live Neon Postgres connection string, a JWT signing secret, and a Gmail app password have been committed to git in the legacy repository since its very first commit (`081b81b`, 2024‑09‑18) — `.gitignore` lists `.env` but that has no retroactive effect on an already-tracked file. The repository is private with a single collaborator, so this is not a public leak, but the credentials are live and every clone of the repo's history carries them. Rotate the database password, `JWT_SECRET`, `NEXTAUTH_SECRET`, and the email app password before anything else in this report — full detail in §12.


## 02. Current System Overview

*Three repositories, three different states of readiness.*

- `Berthonge21/BTHG-Rental-Car — legacy monolith, private, last pushed 2026-01-29`
- `Berthonge21/BTHG-Rental-Car-2 — real backend, private, last pushed 2026-03-09`
- `Berthonge21/bthg-rental-web — frontend, public, last pushed 2026-03-09`

| Repository | What it is | Stack | Status |
| --- | --- | --- | --- |
| `BTHG-Rental-Car` | Full-stack monolith — API routes *and* its own admin/super-admin/client UI in one Next.js app | Next.js 14 Pages Router, Prisma → PostgreSQL (Neon), NextAuth + 2 custom auth systems | Superseded. Not receiving development. Still holds committed production secrets. |
| `BTHG-Rental-Car-2` | The current, real backend — a proper API service with a published client SDK | Turborepo monorepo: NestJS API (`apps/api`), Prisma/PostgreSQL package (`packages/database`), TypeScript SDK (`packages/sdk`), empty reserved `apps/web` slot | Active, working, narrow-but-complete API surface (42 routes, all implemented, none stubbed). |
| `bthg-rental-web` | The current, real frontend — an admin/super-admin console | Next.js 14 App Router, TypeScript strict, Chakra UI, Zustand, TanStack Query, React Hook Form + Zod | Cannot currently be installed (§8). Admin+super-admin surfaces are substantially complete; no client-facing surface exists. |

The legacy repo's own `docs/ARCHITECTURE.md` describes, in detail, a target architecture of "NestJS + Turborepo monorepo + Chakra UI + Swagger" — which is, almost feature-for-feature, what `BTHG-Rental-Car-2` and `bthg-rental-web` became. The rewrite the old repo's documentation predicted is the system now in place. That is a healthy signal about intent; the gap is that the migration was never finished or formally closed out — the old repo was merely abandoned, not decommissioned, and it still contains a live credential leak (§12) and a full UI that could confuse a new contributor about which system is authoritative.


## 03. Architecture

*How the pieces actually connect today, versus how the SDK says they should.*

*[Diagram: Architecture diagram showing three repositories and their real connections — see the published report for the visual: https://claude.ai/code/artifact/ccdfedc3-9f3e-4101-8ae0-b71efa072d0e#s3]*

### The legacy monolith (`BTHG-Rental-Car`)

A single Next.js Pages Router application with no service layer, no repository layer, no DTOs, and no shared authorization module — 73 API route files under `pages/api/`, each handler independently re-implementing auth, validation, and business logic. `middleware.js` matches only three UI paths and zero API routes, so there is no platform-level gate; every route self-polices, and (§6, §12) most of them do not. A custom `server.js` exists for a Socket.IO real-time feature but is never started in the Docker image or compose files, making it dead code that still ships.

### The real backend (`BTHG-Rental-Car-2`)

A proper NestJS application: 7 modules (`auth`, `agencies`, `cars`, `rentals`, `users`, `admin`, `super-admin`), each with controller + service + DTOs, behind a global `JwtAuthGuard` registered as `APP_GUARD` so routes must explicitly opt out via `@Public()` rather than opt in to protection — the safer default. A strict `ValidationPipe` (`whitelist`, `forbidNonWhitelisted`, `transform`) runs globally. All 42 SDK-exposed operations map 1:1 to real, implemented routes — this is a working system, not a scaffold. `apps/web` is an empty reserved slot, not a duplicate frontend.

### The frontend (`bthg-rental-web`)

Next.js App Router with route groups `(auth)`, `(admin)`, `(super-admin)`, each with its own `layout.tsx` guard. State splits cleanly: Zustand for auth/identity, TanStack Query for all server data, with a well-built query-key hierarchy and real cross-domain cache invalidation. All HTTP concerns are meant to live inside the SDK dependency rather than in the app itself — which is precisely why the broken dependency path (§8) is so damaging: it does not just block a build, it hides the entire API contract from static analysis.


## 04. Business & Domain Model

*The entities, as actually modeled in the real backend's Prisma schema.*

| Model | Role | Key relations | Notable gap |
| --- | --- | --- | --- |
| `Agency` | A tenant | `responsibleId` → one `AgencyUser` (1:1, `@unique`) | No reverse `AgencyUser.agencyId` — see §5 |
| `AgencyUser` | An agency admin | → Agency (via responsibleId, reverse only) | Can exist with no agency at all |
| `Client` | A customer | ← Rental[] | No booking-creation UI exists anywhere (§7) |
| `Car` | A rentable vehicle | → Agency, → Parking?; ← Rental[], Maintenance[], Availability[] | No unique constraint on `registration` (license plate) |
| `Rental` | A booking / reservation | → Car (Cascade), → Client (Restrict) | No `agencyId` — tenancy is transitive only, via Car; no `createdAt`/`updatedAt` |
| `Parking` | A physical lot | → Agency; ← Car[] | Modeled, no API surface yet (backend-2); has one in the legacy repo |
| `Maintenance` | Service record for a car | → Car (Cascade) | No timestamps |
| `Availability` | Blocked/held dates for a car | → Car (Cascade), `@@unique([carId,date])` | The only genuinely indexed relation in the schema |
| `Notification` | In-app message | → Agency | Modeled, unused in both repos |

**Rental lifecycle:** `RentalStatus { reserved, ongoing, completed, cancelled }`. The intended graph is `reserved → ongoing → completed` and `reserved → cancelled`. Neither backend enforces this graph server-side (§6, §12) — any authenticated caller with update access can set any status directly, including a client moving their own booking straight to `completed`.

**Roles:** `UserRole { admin, superAdmin }` for agency-side staff; `ClientRole { user }` for customers (a single-value enum — there is no customer tier differentiation today, which is fine for current scope but worth naming as a modeling choice rather than an oversight).


## 05. Multi-Agency / Tenant Architecture

*This is the section the rest of the security findings trace back to.*

The product intent is clear and consistently understood by both backends: agencies are isolated tenants, agency staff see only their own agency's data, and a super admin sees everything. The *mechanism* differs sharply between the two backends, and the real backend's mechanism has one structural defect that explains most of its critical findings.

### Real backend (`BTHG-Rental-Car-2`) — the authoritative system

Identity is correctly re-derived from the database on every request (`jwt.strategy.ts:28-74`) rather than trusted from the JWT payload — a tampered `agencyId` claim is simply ignored, which is exactly right. The failure is upstream of that: because `Agency.responsibleId` is `@unique` with no corresponding `AgencyUser.agencyId` field, the schema only supports **one admin per agency**, and admins created outside that single relationship — via `super-admin.createUser`, for instance — can end up with *no agency at all*. Five separate tenancy checks across `cars.service.ts` and `admin.controller.ts` are written as `if (userAgencyId && dto.agencyId !== userAgencyId) throw`. When `userAgencyId` is `undefined`, JavaScript short-circuits the whole expression to `false`, and the guard silently does nothing. A tenant-less admin — which the schema itself permits and the super-admin creation flow can produce — can create, update, or delete any agency's cars.

> **[CRITICAL] Tenancy guard evaluates to a no-op for admins with no assigned agency**
>
> **Evidence:** `cars.service.ts:92,112,133,295,345`; `admin.controller.ts:49,71,95,121,125` — repeated pattern `if (userAgencyId && dto.agencyId !== userAgencyId) throw new ForbiddenException()`, and the write path itself: `return this.prisma.car.create({ data: dto })` — `dto.agencyId` is written verbatim, never overridden server-side.
>
> **Impact:** Any admin whose account has no `agencyId` — a state the schema allows by design — bypasses tenant scoping on car create/update/delete and on availability blocking, across every one of the 5 call sites.
>
> **Risk:** Cross-tenant write access. This is the platform's core isolation promise failing for a user class the data model itself creates.
>
> **Recommendation:** Add `AgencyUser.agencyId` as a required field (or a real many-to-one with a `NOT NULL` constraint enforced at creation), replace all five ad-hoc checks with a single `TenantGuard`/decorator that throws if `agencyId` is absent rather than treating absence as "unscoped," and add the tenant-isolation regression tests recommended in §20 before shipping the fix.
>
> P0 · Complexity: Medium


Everything downstream of that fix is solid. **All 7 `super-admin/*` routes are genuinely role-gated** — `@Roles('superAdmin')` is applied at the controller class level, paired with `RolesGuard`, and I confirmed the guard reads role from the freshly-queried database user, not from the token. Role and agency reassignment on a user's own profile is blocked by two independent mechanisms (a DTO with no `role`/`agencyId` field, plus `forbidNonWhitelisted: true` rejecting any extra property outright) — this is one of the strongest parts of either codebase.

### Legacy backend (`BTHG-Rental-Car`) — for context, not for production reliance

Tenancy is expressed as an agency *name string* rather than an id in several handlers (convenient for a server-rendered page that already knows the name, symptomatic of the fact this repo's API was built to serve its own UI, not as a public contract). A tenant-scoping helper is copy-pasted roughly sixteen times across route files, with no two copies quite agreeing on what they return; role is checked in exactly zero of the 73 API routes. The full breakdown is in §6 and §12 — it is retained here only because the repository is still live in the org and its data model (and its committed secret) remain a real operational risk until formally retired.

### Frontend's role in tenancy

The frontend computes `agencyId` client-side from a `localStorage`-persisted store and sends it as a query parameter on car list/create requests (`cars/page.tsx:534`, `cars/new/page.tsx:38-51`). This is correct and expected for a public catalogue endpoint (§8 confirms the backend intentionally treats `GET /cars`'s `agencyId` as a public filter, not an authorization boundary), but on the *write* path — `POST /cars` — it interacts directly with the Critical finding above: the frontend's job is UX-level convenience, and the backend fixing its own guard is what actually closes the gap. Frontend authorization here is correctly understood by its own author as UX, not security — the risk is entirely server-side, and entirely inside the finding above.


## 06. Backend Audit

*Both backends, each on its own terms. The real backend is treated as authoritative; the legacy backend as a retiring system that still needs closing out.*

### 6.1 — `BTHG-Rental-Car-2` (real backend): what's already good

- **Fail-closed global auth** — `JwtAuthGuard` as `APP_GUARD` (`app.module.ts:32-37`); routes must opt out via `@Public()`, the safer default direction.
- **JWT is not trusted for authorization state** — `JwtStrategy.validate` re-reads the user and re-derives `agencyId` from the database every request (`jwt.strategy.ts:28-74`). A tampered claim is simply ignored.
- **Deactivated accounts are rejected at the strategy level**, not only at login — a token dies immediately on deactivation, not merely on next login attempt.
- **Strict `ValidationPipe`** (`whitelist` + `forbidNonWhitelisted` + `transform`, `main.ts:54-63`) — this single line of configuration blocks the entire mass-assignment / privilege-escalation class of bug.
- bcrypt cost 12; login responses are not user-enumerable; no SQL injection surface exists anywhere (zero `$queryRaw`/`$executeRaw` in the codebase).
- No secrets ever committed — verified via `git log --all -- '*.env*'` and inspection of the (placeholder-only) example env files.
- A mature 401-refresh interceptor with request queueing on the SDK side; a consistent pagination envelope; thorough Swagger documentation.

### 6.2 — `BTHG-Rental-Car-2`: the other 14 findings that matter

> **[CRITICAL] Client-supplied `total` on `POST /rentals` is persisted verbatim**
>
> **Evidence:** `create-rental.dto.ts:40-47`, `rentals.service.ts:139`
>
> **Impact:** Any authenticated client can book any car for any price, including €0.
>
> **Risk:** Direct revenue loss; also feeds every financial report downstream.
>
> **Recommendation:** Compute price server-side from `Car.price` and the date range; ignore any client-supplied total.
>
> P0 · Complexity: Small


> **[CRITICAL] Double-booking race: check-then-insert, no transaction, no DB constraint**
>
> **Evidence:** `rentals.service.ts:120-151` — availability is queried, then a rental is created in a separate statement with no `$transaction` and no exclusion constraint between them.
>
> **Impact:** Two concurrent requests for the same car and overlapping dates can both succeed.
>
> **Risk:** Data integrity failure under real concurrent load — the exact scenario multi-agency scale makes common.
>
> **Recommendation:** Wrap check+create in `prisma.$transaction` with `Serializable` isolation, and add a PostgreSQL exclusion constraint (`EXCLUDE USING gist` on `carId` + a date range) as the real backstop — the transaction alone is not sufficient under Postgres's default isolation.
>
> P0 · Complexity: Medium


> **[CRITICAL] Refresh token is indistinguishable from an access token**
>
> **Evidence:** `auth.service.ts:238-252` — same signing secret, same payload shape, no `tokenType` claim.
>
> **Impact:** A leaked access token is usable as a refresh token, extending its effective lifetime from the access-token TTL to the full 7-day refresh window.
>
> **Risk:** Materially widens the blast radius of any token leak.
>
> **Recommendation:** Add a `tokenType: 'access' | 'refresh'` claim and reject mismatched use at the refresh endpoint.
>
> P0 · Complexity: Small


> **[CRITICAL] Hardcoded JWT secret fallback, no startup validation**
>
> **Evidence:** `configuration.ts:28` — `JWT_SECRET = 'default-secret-change-me'` used whenever the env var is unset, with nothing that fails startup if it is.
>
> **Recommendation:** Fail fast on boot if `JWT_SECRET` is missing or matches the known default.
>
> P0 · Complexity: Small


> **[CRITICAL] Routine `dev` start can mutate the production schema**
>
> **Evidence:** `turbo.json:11` — `dev` depends on `db:deploy`, which resolves to `prisma db push` (`packages/database/package.json:19`) against whatever `DATABASE_URL` is currently configured.
>
> **Impact:** `prisma db push` can drop columns to force the database to match the schema. Combined with the absence of a migrations directory (next finding), an ordinary `yarn dev` against a shared or production database is a schema-mutation event with no review step.
>
> **Recommendation:** Remove `db:deploy` from the `dev` pipeline entirely; schema changes should only ever happen through an explicit, reviewed migration step.
>
> P0 · Complexity: Small


> **[CRITICAL] No migration history exists at all**
>
> **Evidence:** `packages/database/prisma/` contains only `schema.prisma` and seed files — no `migrations/` directory anywhere in the repo, at any commit.
>
> **Impact:** No record of how the schema reached its current state, no reviewable diff for a schema change, no rollback path, no deterministic way to reproduce the database from scratch, and no drift detection between environments.
>
> **Recommendation:** Baseline a migration from the live schema (`prisma migrate diff` + `migrate resolve --applied`), then switch to `prisma migrate deploy` as the only schema-mutation path in every environment, gated as an explicit CI/CD step.
>
> P0 · Complexity: Medium


> **[CRITICAL] The one-admin-per-agency schema constraint**
>
> **Evidence:** `schema.prisma:55,64,69` — `Agency.responsibleId @unique`, no `AgencyUser.agencyId`.
>
> **Impact:** Caps every agency at exactly one admin account and is the root cause of the tenancy-guard finding above.
>
> **Recommendation:** Add `AgencyUser.agencyId` as a proper foreign key, required, indexed.
>
> P0 · Complexity: Medium


> **[CRITICAL] No tests exist**
>
> **Evidence:** `find -name '*.spec.ts'` returns nothing; the sole e2e spec asserts `expect(app).toBeDefined()` and nothing else.
>
> **Recommendation:** See §20 for the specific test suite to write before touching authorization code.
>
> P0 · Complexity: Medium


> **[HIGH] `GET /agencies/:id/stats` and the availability calendar leak cross-tenant data**
>
> **Evidence:** `agencies.controller.ts:154-172` — no ownership check, any admin reads any agency's revenue stats. `cars.controller.ts:161-184` / `cars.service.ts:230-236` — no ownership check on the availability calendar, which additionally leaks customer names cross-tenant.
>
> **Recommendation:** Apply the same tenant guard recommended above to these two routes.
>
> P1 · Complexity: Small


> **[HIGH] Identity-space collision between admin and client ids on `/rentals`**
>
> **Evidence:** `rentals.controller.ts:34`, `rentals.service.ts:22,93` — the generic rentals endpoints use `user.id` as though it were always a `Client.id`. An `AgencyUser.id` can numerically collide with a `Client.id`.
>
> **Impact:** An admin calling the client-facing `/rentals` route (rather than `/admin/rentals`) can read or cancel a customer's booking that happens to share their id.
>
> **Recommendation:** Scope the client-facing service strictly to the `Client` table by role, not by numeric id alone; documented as a known trap for the frontend in §8.
>
> P1 · Complexity: Small


> **[HIGH] `GET /agencies` is public and returns every admin's email**
>
> **Evidence:** `agencies.controller.ts:33`, `agencies.service.ts:22` — `@Public()`, no field restriction.
>
> **Impact:** A ready-made target list of valid admin login identifiers for the (also-missing) rate limiting below.
>
> **Recommendation:** Strip the responsible admin's email from the public response shape.
>
> P1 · Complexity: Small


> **[HIGH] No rate limiting anywhere**
>
> **Evidence:** `@nestjs/throttler` is absent from `apps/api/package.json`; five public auth routes, 6-character minimum password, combined with the public admin-email list above.
>
> **Recommendation:** Add `@nestjs/throttler` globally, tighter limits on `/auth/*`.
>
> P1 · Complexity: Small


> **[HIGH] No status-transition validation on rental updates**
>
> **Evidence:** `rentals.service.ts:320` — `data: { status: status as any }`. Any enum value is accepted from any state, including a client setting their own new booking straight to `ongoing` or `completed` via the client-facing `PATCH`.
>
> **Recommendation:** Encode the transition graph server-side (§4) and reject invalid moves; restrict which roles may perform which transitions.
>
> P1 · Complexity: Small


> **[HIGH] Base64 images in unbounded text columns, unauthenticated write path**
>
> **Evidence:** `schema.prisma` — `image String?` on five models, no `@db.VarChar`, no `@MaxLength` on any corresponding DTO; `main.ts:39-41` sets a 15 MB body limit specifically for base64 images (commit `733111f`); no upload endpoint, no `multer`, exists anywhere in the repo. `POST /auth/register` is public and accepts the same unbounded field.
>
> **Impact:** The dominant performance and cost problem at scale — full car rows serialize with multi-MB images inline, database size scales with image payload, and there is no content-type validation, dimension limit, or CDN.
>
> **Recommendation:** Move to Supabase Storage with signed upload URLs (§10); drop the body limit back down once direct-to-storage upload replaces base64.
>
> P0 · Complexity: Medium


Three dashboard endpoints (`admin.service.ts:24-27`, `super-admin.service.ts:40`, `agencies.service.ts:161-164`) load the full corresponding rental table into API memory just to count statuses via `.filter().length` — the super-admin one has *no `where` clause at all*, meaning every platform-wide dashboard load fetches every rental on the entire platform. This is covered fully as a scalability finding in §13.

### 6.3 — `BTHG-Rental-Car` (legacy): the findings that still matter operationally

This system is not receiving development, but it is still a live, private repository with a real production database connection committed to it, and its findings are worth recording precisely because "we're not touching that anymore" is exactly the condition under which a committed secret goes unrotated indefinitely.

> **[CRITICAL] Anonymous privilege escalation to `superAdmin`**
>
> **Evidence:** `pages/api/super-admin/register.js:4-42` — no authentication check anywhere in the handler; `role` is read directly from `req.body` at line 10 and written to the new user at line 35; the response includes the created user's bcrypt hash.
>
> **Impact:** One unauthenticated `POST` creates a platform-owning account.
>
> **Recommendation:** If this repository is kept live at all, disable this route immediately; otherwise decommission the repository per §19/§23.
>
> P0 · Complexity: Small


> **[CRITICAL] Password reset never validates its own token**
>
> **Evidence:** `pages/api/admin/agent-reset-password.js:83-105` takes `{agentId, password}` straight from the request body and updates the row; the reset token minted at lines 23-29 and emailed to the user is never checked anywhere in the file — no `jwt.verify` call exists for it.
>
> **Impact:** A single unauthenticated `PUT {"agentId":1,"password":"x"}` resets the super admin's own password.
>
> P0 · Complexity: Small


The remaining legacy findings — 49 of 73 routes with no authentication at all, mass unfiltered PII disclosure, arbitrary file write via `path.join` normalizing `../` in ten separate upload handlers, unconditional rental creation with no availability check, and a cross-tenant filter silently dropped whenever Prisma receives `agencyId: undefined` — are catalogued in full, each with file:line evidence, in §12's Critical/High tables. The isolation verdict for this repository, stated plainly: **tenant isolation was attempted but not achieved** — 49 of 73 routes have no authentication, role is checked in zero routes, and authorization is inconsistent even within single files (the same handler correctly scopes its `GET` and misses the scope on its own `DELETE`). The one piece of good news: the correct pattern already exists in three places in this codebase (`manage-cars/cars.js:152,240,339`) — remediation, if this repo were kept alive, would be propagating an existing in-house pattern into one shared helper, not inventing a new one.


## 07. Frontend Audit

*`bthg-rental-web` — small, clean, and currently unbuildable.*

### 7.1 — What's already good

- TanStack Query key factories are textbook — hierarchical, `as const`, with genuinely thought-through cross-domain cache invalidation (creating a car correctly invalidates both car lists and both dashboards).
- Every meaningful form pairs React Hook Form with a real Zod schema.
- `useColorModeValue` is consistently hoisted above early returns, with comments showing the team hit and then systematically fixed the hooks-order bug once, rather than patching it ad hoc each time.
- The account deactivation/reactivation flow correctly distinguishes self-deactivation from admin-initiated deactivation, and only offers reactivation on the former.
- TypeScript `strict: true`, with only 6 occurrences of `any` across roughly 8,500 lines.
- **Zero** occurrences, anywhere in the tree, of `dangerouslySetInnerHTML`, `eval`, hardcoded credentials, or `console.log` of sensitive data.
- `rental.total` is always read from the server response and never recomputed client-side — pricing authority is correctly kept server-side, which is the right call given §6's finding that the backend itself doesn't yet enforce this consistently.

### 7.2 — Product surface completeness

**Roughly 60% of a full rewrite, and it is important to be precise about which 60%:** 3 auth routes, 9 agency-admin routes (dashboard, full car CRUD, an availability calendar — the strongest component in the repo — rentals list and detail, profile), and 7 super-admin routes (dashboard, agency CRUD, admin CRUD with agency assignment, platform-wide rentals, profile) are substantially complete.

> **What is entirely absent**
>
> There is no customer-facing product anywhere in this repository: no car browsing, no date/price search, no booking flow, no checkout, no "my rentals," no client profile. `src/app/page.tsx:26` contains the comment `// Client portal not yet available`. The five rental-mutation hooks (`useCreateRental`, `useUpdateRental`, `useCancelRental`, `useRentals`, `useRental`) are defined but **never called by any page** — grep-verified. A registered client who logs in today is bounced in a redirect loop back to the login page, because the nav items that should route them (`Sidebar.tsx:132`) point at routes that do not exist.


This should be positioned to stakeholders as "the back-office, shipped first" — not as "the replacement, nearly done." The gap is not polish; it is an entire product surface.

### 7.3 — The headline defects

> **[CRITICAL] The SDK dependency path doesn't exist — the project cannot be installed**
>
> **Evidence:** `package.json:12` — `"@bthgrentalcar/sdk": "file:../BTHG-Rental-Car-2/packages/sdk"`. The sibling directory this repo actually sits next to is named `BTHG-Rental-Car` (no `-2`), and that directory has no `packages/sdk` at all. `node_modules/` is absent.
>
> **Impact:** `yarn install` fails; nothing builds or typechecks. Every HTTP path, header, interceptor, retry policy, and all 49 domain types the frontend relies on live entirely inside this one unreachable dependency (`src/lib/api.ts` is only 14 lines by design).
>
> **Recommendation:** Correct the path to the real sibling checkout, or — the more durable fix — resolve the SDK through the published GitHub Packages registry per §8/§19 rather than a relative filesystem path, so the frontend never depends on a specific local directory layout again.
>
> P0 · Complexity: Small


> **[CRITICAL] Both dashboards display fabricated revenue figures**
>
> **Evidence:** `admin/dashboard/page.tsx:112-113` and `super-admin/dashboard/page.tsx:126-127`: `revenue: index === currentMonth ? (stats?.monthlyRevenue || 0) : Math.floor(Math.random() * 15000) + 5000`, plus hardcoded percentage deltas and a literal fallback `stats?.totalRevenue || 89483`.
>
> **Impact:** Agency owners and the super admin are shown invented revenue history that re-randomizes on every re-render, alongside one real number.
>
> **Recommendation:** Show an honest empty/partial state until a real revenue time-series endpoint exists (§6 confirms the backend has none today) rather than a chart that looks authoritative and isn't.
>
> P0 · Complexity: Small


> **[HIGH] Base64 images with no client-side resizing**
>
> **Evidence:** `imageUtils.ts:57-70` reads files to full-fidelity data URLs; `CarForm.tsx:140` serializes up to 4 of them into one JSON field. Four 2 MB photos becomes roughly a 10.7 MB request body.
>
> **Recommendation:** Resize/compress client-side before submission regardless of what the backend does about storage — this halves the fix even before Supabase Storage (§10) removes the problem at the source.
>
> P0 · Complexity: Large


> **[HIGH] Detail pages resolve a single entity by scanning a 100-row list**
>
> **Evidence:** `super-admin/admins/[id]/page.tsx:59,70` fetches `getUsers({limit:100})` then `.find(u => u.id === adminId)` — there is no get-one-admin call anywhere in the app, and §6 confirms the backend has no such endpoint either.
>
> **Impact:** Admin #101 renders "not found" even though the record exists — a correctness bug that appears exactly as the platform grows, which is the scale this platform is meant to reach.
>
> **Recommendation:** Add `GET /super-admin/users/:id` server-side (§22 confirms it's a small addition) and switch the frontend to call it directly.
>
> P1 · Complexity: Small + backend


> **[HIGH] No error boundary; failed fetches render as empty states**
>
> **Evidence:** Grep-confirmed: zero pages destructure `error`/`isError` from a query result. A failed fetch renders identically to "no rentals found." Roughly 12 unguarded field dereferences exist alongside this (e.g. `rental.total.toFixed(2)`, `car.mileage.toLocaleString()`).
>
> **Recommendation:** Add a route-level error boundary and render actual error states from query results.
>
> P1 · Complexity: Medium


### 7.4 — Security posture (frontend-specific)

Genuinely clean on the checks that matter most: no `dangerouslySetInnerHTML`, no `eval`, no hardcoded secrets, no sensitive `console.log`, no open redirects, no secrets leaking through `NEXT_PUBLIC_*`. Two real items: **tokens live in `localStorage`** (XSS-exfiltratable by design of the SDK's default storage), and **no security headers are set at all** — no CSP, no `X-Frame-Options`, no HSTS — making the app clickjackable as shipped. `next.config.js` also allows remote images from any hostname (`remotePatterns: hostname: '**'`), functioning as an open image proxy. Next.js itself is pinned at 14.1.0, roughly 1.5 years behind, including the window for CVE-2025-29927 (a middleware authorization bypass) — impact is reduced here because the frontend's own middleware does no authorization work to bypass (§8), but the version should still move.

### 7.5 — `middleware.ts` is inert

It reads a cookie into a variable that is never used and unconditionally calls `NextResponse.next()` (`middleware.ts:17-21`); the route-pattern constants it declares are never referenced. It protects nothing. This is not itself dangerous — the route-group layouts perform the real (UX-level) gating — but a middleware file that reads as if it enforces something and doesn't is a maintenance hazard: the next engineer who needs to add a real check will reasonably assume one already exists here.


## 08. Frontend ↔ Backend Integration Audit

*Where the two independent audits agree, disagree, and where the contract itself is simply wrong.*

> **Cannot currently be verified end-to-end**
>
> Because `bthg-rental-web` cannot install its own dependencies (§7), nothing in this section could be confirmed by actually running the frontend against the backend. Everything below comes from reading the frontend's expectations (the SDK's exported types and call sites) against the backend's actual controllers, DTOs, and Prisma `select` clauses — read independently by two separate agents who could not see each other's repositories, then reconciled here.


### 8.1 — The SDK contract, verified line by line

All 42 SDK-exported operations resolve to real, implemented routes on the real backend — there are no orphaned client calls and no unimplemented server routes on the surface actually used. That agreement is the good news. Four places the contract actively lies about what the server does:

| SDK claims | Server actually does | Consequence |
| --- | --- | --- |
| `auth.register()` typed as returning `AuthResponse` (tokens included) | Returns `{message, user}` — no tokens at all | Any "log the user in immediately after registration" flow is silently broken |
| `superAdmin.assignAgency()` typed as returning `AdminUser` | Returns an `Agency` object | Any code reading admin fields off the response reads the wrong shape |
| `UserProfile.status` / `.deactivatedAt` typed as required | `GET /users/me`'s Prisma `select` omits both fields | Any deactivation-state UI keyed off these fields never fires |
| `AdminUser.deactivatedAt` typed as present | `/super-admin/users` omits it the same way | Same failure mode, super-admin surface |

### 8.2 — The specific cross-layer questions, answered

The frontend agent logged questions it could not answer without seeing the backend; the backend agent logged the same for the frontend. Assembling both sides:

| Question | Answer |
| --- | --- |
| Does `GET /cars` honor a client-supplied `agencyId`? | Yes, deliberately — it's the public catalogue, correctly `@Public()` with no ownership check. Not a vulnerability. |
| Does `POST /cars` override a client-supplied `agencyId`? | No — it validates against mismatch rather than overriding, and (§5, §6) that validation is skipped entirely for admins with no assigned agency. The frontend must always send the admin's own id; it cannot rely on the server to correct a wrong one today. |
| Are `startTime`/`endTime` full ISO datetimes or `"HH:mm"` strings? | Full ISO-8601 datetimes, validated server-side with `@IsDateString()`. Sending a bare time string produces an Invalid Date and a 500. |
| Does `Rental.client.image` exist? | No — neither on the SDK type nor in any server `select`. `Rental.client.telephone` does exist on both sides. |
| Is there a get-one-admin/user endpoint? | No. The frontend's `limit:100` + client-side `.find()` workaround (§7) is a correct compensation for a genuinely missing endpoint, and a small one to add. |
| Is there a revenue time-series endpoint? | No — only two scalars exist server-side. The frontend's `Math.random()` chart (§7) has no real data source to draw from yet. |
| What is the request body size limit? | 15 MB, both JSON and urlencoded, specifically sized for base64 images — with no per-field cap, so a full-size image string is accepted into an unbounded `text` column. |
| Is it safe for an admin session to call the generic `GET /rentals`? | No (§6) — the client/admin id-space collision means it can return a stranger's bookings. Admins must always use `/admin/rentals`. |
| Does the SDK's `debug: true` mode log anything sensitive? | Yes — full response bodies, including both JWTs from login and refresh. It is correctly gated to development only (`NODE_ENV === 'development'`), which limits but does not eliminate the exposure on developer machines. |

### 8.3 — Where the two independent audits reached the same conclusion by different routes

This is the strongest form of confirmation available in this audit: two agents, each blind to the other's repository, independently flagged the same seam.

- **The client-supplied `agencyId` on car creation.** The frontend audit flagged, without seeing backend code, that "tenant scoping is computed client-side and sent to the server as a parameter" as its #2 highest-severity finding. The backend audit, without seeing the frontend, independently identified the exact server-side guard that fails to validate it. Neither agent knew the other had found the matching half.
- **The missing get-one-admin endpoint.** The frontend flagged the `limit:100`+`.find()` workaround as suspicious; the backend confirmed no such endpoint exists and estimated it as a ten-line addition.
- **The fabricated revenue chart.** The frontend flagged `Math.random()` as a product-integrity defect; the backend independently confirmed there is no revenue time-series endpoint for it to have called instead — so the frontend defect and the backend gap are the same missing feature, not two separate problems.

### 8.4 — Contract inconsistencies worth fixing regardless of severity

`AdminUser` carries all three of `agencyId`, `agencyName`, and a nested `agency:{id,name}` object from the same source field — pick one shape. Elsewhere the nested object is the only form, and on `Car` it is capitalized (`Agency:{id,name}`) where everywhere else it is lowercase. Query parameters the frontend can set — `AgencyQueryDto.search/status`, `AdminUserQueryDto.role/search` — are silently accepted and ignored server-side; filtering on those fields currently only works if implemented client-side.


## 09. Database Audit

*Two Postgres databases. One is being retired; the other is where the Supabase question actually applies.*

### 9.1 — Real backend (`packages/database`) — the schema that matters going forward

Provider is already `postgresql`. Nine models, four enums (§4). The single most consequential database finding, independent of any migration decision:

> **[CRITICAL] There is not one secondary index anywhere in the schema**
>
> **Evidence:** `grep '@@index' schema.prisma` returns nothing. The only non-primary-key index in the entire schema is the `@@unique([carId,date])` on `Availability`.
>
> **Impact:** Every hot query is a sequential scan today, invisible at current data volume: `Car.agencyId` (the tenant discriminator itself), `Rental.clientId`, and — worst of all — the booking hot path's `rental.findFirst({carId, status, startDate, endDate})`, which will scan the entire rentals table on every single reservation attempt once the table has any real size.
>
> **Recommendation:** Minimum viable set: `Car(agencyId)`, `Car(agencyId, createdAt)`, `Rental(clientId)`, `Rental(carId, status)`, `Rental(status, endDate)`, `Rental(carId, startDate, endDate)`, `Parking(agencyId)`, `Notification(agencyId, readStatus)`, `Maintenance(carId)` — plus a PostgreSQL GiST exclusion constraint on `Rental(carId, daterange(startDate,endDate))`, which does double duty as both an index and the concurrency fix from §6.
>
> P0 · Complexity: Small (but needs the migration mechanism below first)


#### Referential integrity

| Relation | `onDelete` | Assessment |
| --- | --- | --- |
| `Rental → Car` | `Cascade` | Deleting a car destroys its entire rental history — including completed, revenue-bearing rentals. Should be `Restrict` plus a soft-delete on `Car`. |
| `Rental → Client` | `Restrict` | Correct. |
| `Maintenance → Car`, `Availability → Car` | `Cascade` | Acceptable — these are genuinely dependent records. |
| `Car → Agency` | default (Restrict) | Functionally fine, but `DELETE /agencies/:id` currently surfaces a raw Prisma error as a 500 instead of a clean 409 — a small fix, not an integrity risk. |

Other schema findings, each already covered with full evidence in §6: no unique constraint on `Car.registration` (a license plate can be registered more than once, enabling duplicate double-bookable vehicle records); `Rental` and `Maintenance` have no `createdAt`/`updatedAt` at all; every other model's `updatedAt` uses `@default(now())` instead of `@updatedAt`, so several services (verified by tracing every write site) forget to bump it manually and the column silently freezes at creation time; no soft deletes anywhere except the `status` enum on `Client`/`AgencyUser`. Six call sites over-fetch full user rows including the password hash into memory, though in every traced case the hash is stripped before the HTTP response — response safety currently depends on a developer remembering to hand-build the return object every time, not on a structural guarantee.

### 9.2 — Legacy backend schema — retained for context only

Also already PostgreSQL (Neon), also zero `@@index` declarations, a single squashed migration named `test_automobelite` with no history since. Not worth investing further design effort in — see §23 for the decommissioning recommendation.


## 10. Supabase Migration Readiness

*The provider is already Postgres. The honest question is what to fix before moving, not whether Postgres fits.*

> **Headline verdict**
>
> Both databases are already `provider = "postgresql"`, and the real backend is a clean, conventional Prisma schema with standard relations. Migration to Supabase is mechanically close to `pg_dump` → `psql` → repoint `DATABASE_URL`. All 9 models and 4 enums port with no structural changes. **Postgres is a natural fit — the database engine was never the problem.**


### 10.1 — Fix first, independent of Supabase

Moving a schema with zero indexes, no audit timestamps, cascade-deleting financial records, and a tenancy model that permits agency-less admins just relocates every one of §6 and §9's findings onto a new host. In order: baseline a real migration history (§9); add the index set above; add `AgencyUser.agencyId` (§5); fix the cascade behavior on `Rental → Car`; add timestamps to `Rental`/`Maintenance`; fix `updatedAt` to `@updatedAt`. None of this is Supabase-specific work — it needs doing regardless, and doing it before migration means the migration itself is a clean cutover rather than a chance to also fix the schema mid-flight.

### 10.2 — Row Level Security: a genuine backstop, honestly scoped

The application connects to the database as a single privileged role for every request, so Supabase's usual `auth.uid()`-based RLS pattern does not directly apply — the app's own database user bypasses row-level policies by default regardless of who's calling the API. The pattern that *would* add real value here is a Prisma middleware that issues `SET LOCAL app.current_agency_id = '...'` at the start of each request, paired with policies that read `current_setting('app.current_agency_id')`. That converts a forgotten tenant filter — precisely the failure mode behind the Critical tenancy finding in §5 and §6 — from a data breach into an empty result set: a genuine defense-in-depth layer.

**Be precise about what RLS would and would not have caught.** It would have mitigated the missing-tenant-filter class of bug. It would *not* have prevented the legacy repo's unauthenticated routes, the missing password-reset token check, or the client-supplied `total` on rental creation — those are missing *authentication* and missing *business-rule enforcement*, and RLS cannot establish who the caller is if the application layer never established it either. Fix application-level authorization first (§6); adopt RLS as the net underneath it, not as a substitute for it. And it needs `AgencyUser.agencyId` to exist before it can be written at all — the RLS conversation is downstream of the P0 schema fix in §6, not a way around it.

### 10.3 — Where Supabase adds real value beyond the database engine

- **Storage — the strongest non-database argument.** §6 and §7 both independently identified base64 images in `text` columns as a major performance and cost liability. Supabase Storage with signed upload URLs removes the 15 MB body-limit problem, shrinks the database by likely an order of magnitude, and eliminates the class of bug entirely rather than mitigating it.
- **Scheduled jobs (pg_cron).** Neither backend has any background job runner today, and rental lifecycle transitions (auto-completing past-due rentals, for instance) currently need one.
- **Managed backups / point-in-time recovery.** Neither system has any documented or configured backup strategy today (§14) — this is a real gap Supabase closes essentially for free.

### 10.4 — Where it adds nothing, said plainly

Supabase Auth: correctly out of scope per your instruction — the existing JWT system stays. Realtime, Edge Functions, and PostgREST are not needed by anything in the current or near-term product; PostgREST specifically would be actively undesirable, since it would open a second, unvalidated write path parallel to the NestJS API's carefully-built validation pipe. Recommendation: adopt Postgres + Storage + managed backups; leave the rest on the shelf until a real requirement names them.


## 11. Authentication & Authorization Audit

*One good system, one fragmented system, and a frontend that correctly treats its own checks as UX.*

### 11.1 — Real backend: the actual authorization model

JWT-based, Passport strategy, with the single design decision that matters most already made correctly: the strategy re-queries the database for the user on every request rather than trusting claims embedded in the token (§5, §6). Deactivated accounts are rejected immediately, not merely at next login. `RolesGuard` is correctly paired with every `@Roles` declaration — I traced all 12 uses individually rather than trusting a pattern search, because "guard declared but never actually wired up" is a common failure mode this audit specifically checked for and did not find here. Password hashing is bcrypt at cost 12. The remaining gaps — the refresh/access token distinguishability issue and the tenancy guard's silent no-op for agency-less admins — are both catalogued with full remediation in §6, and neither is a "the model is wrong" problem; both are implementation gaps in an otherwise sound model.

### 11.2 — Legacy backend: three parallel, independent auth systems

NextAuth (`[...nextauth].js`), a custom `auth/login.js` issuing a cookie no server route ever reads, and separate `admin/login.js`/`super-admin/login.js` handlers querying the same table with different session TTLs (7 days vs. 5 hours) — and the super-admin variant skips the status check the admin variant performs. Cookie flags are inconsistent between the two systems: one sets `httpOnly` but omits `secure`/`sameSite`; the other sets `secure`+`sameSite` but omits `httpOnly`. Role is never checked anywhere in the 73 API routes. This is not a system worth hardening in place — see §23's decommissioning recommendation.

### 11.3 — Frontend authorization posture

The frontend's own layout guards for `(admin)` and `(super-admin)` read from a `localStorage`-persisted client store. That store is correctly re-validated against the server on every app boot (`fetchUser()` calls `auth.me()` rather than trusting the cached copy) — the right instinct. But because the guards ultimately gate on client-mutable state, and because `middleware.ts` performs no server-side check of its own (§7), a user could in principle alter their local store to render the super-admin shell and attempt super-admin API calls. Whether those calls succeed is entirely a backend question, and §6/§11.1 confirm the backend does correctly reject them at the guard level. **No frontend change is required for security here** — the layout guards are doing exactly what frontend authorization should do (UX), and the backend is doing what backend authorization should do (the actual gate). The one real action item is documentation: a comment in the layout files stating plainly that this check is UX-only would prevent a future engineer from mistaking it for the security boundary.


## 12. Security Audit

*Every finding from every layer, in one severity-ordered register.*

- **11** — Critical, combined
- **14** — High, combined
- **9** — Medium, combined
- **6** — Low / Informational, combined

### Critical

| Finding | System | Evidence |
| --- | --- | --- |
| Live DB password, JWT secret, NextAuth secret, and email app password committed to git since first commit | Legacy | `.env`, tracked since `081b81b` |
| Anonymous privilege escalation to superAdmin | Legacy | `super-admin/register.js:4-42` |
| Password reset never validates its own token | Legacy | `agent-reset-password.js:83-105` |
| 49 of 73 routes have no authentication at all | Legacy | full per-route table, §6 |
| Mass unauthenticated PII + password-hash disclosure | Legacy | `manage-user/user.js:59` |
| Unauthenticated account takeover (password/email update) | Legacy | `client/updatePassword.js` |
| Arbitrary file write via unsanitized upload filename, ×10 handlers | Legacy | `client/upload.js:20-26` et al. |
| Double-booking possible — rental created before availability is checked | Legacy | `client/reservation.js:81-112` |
| Client-supplied price and status on booking creation | Both | legacy `client/reservation.js:89-90`; real backend `create-rental.dto.ts:40-47` |
| Auth bypass by omitting the auth cookie | Legacy | `super-admin/car-agence/cars.js:8-20` |
| Tenancy guard is a silent no-op for agency-less admins | Real backend | `cars.service.ts:92,112,133,295,345` |

### High

| Finding | System |
| --- | --- |
| `onDelete: Cascade` on `Rental → Car` destroys financial history on car deletion | Both |
| Anonymous platform-wide financial report disclosure | Legacy |
| Silent cross-tenant filter drop when Prisma receives `agencyId: undefined` | Legacy |
| Refresh token indistinguishable from an access token | Real backend |
| No migration history; `db push` is the only schema mechanism | Real backend |
| Ownership check missing on agency stats and availability-calendar endpoints (cross-tenant read + PII leak) | Real backend |
| Client/admin id-space collision on generic `/rentals` | Real backend |
| Public endpoint exposes every agency admin's email | Real backend |
| No rate limiting anywhere | Real backend |
| No status-transition validation on rental updates | Real backend |
| Base64 images, unbounded columns, unauthenticated write path via registration | Real backend |
| No security headers/CSP anywhere; open image-hostname allowlist (`'**'`) | Frontend |
| Tokens stored in `localStorage` (XSS-exfiltratable) | Frontend |
| Next.js ~1.5 years behind on security patches, spans CVE-2025-29927's affected range | Frontend |

### Medium

- Password hashes over-fetched into memory at six call sites (never reach the HTTP response, but response safety depends on manual field-listing rather than a structural guarantee) — Real backend
- `Car.registration` has no unique constraint — Real backend
- `updatedAt` uses `@default(now())` instead of `@updatedAt`, silently frozen on several models — Real backend
- No soft deletes anywhere except a status enum on two models — Both backends
- Two divergent seed scripts with different bcrypt costs and conflicting fixture identities — Real backend
- Compiled seed artifacts committed to git — Real backend
- SDK `debug: true` mode logs full JWTs to the console in development — Real backend / SDK
- Cookie flags inconsistent across the two custom legacy login systems — Legacy
- TLS verification disabled (`rejectUnauthorized: false`) in the legacy mail transport, duplicated across 7 handlers — Legacy

### Low / Informational

- Redundant `@UseGuards(JwtAuthGuard)` on routes already covered by the global guard — harmless, but obscures which routes are actually protected by what — Real backend
- Stale "Automobelite" naming surfacing in Swagger docs and a legacy seed script — Real backend
- Dependency versions generally current on the real backend and frontend; the legacy repo's dependency surface was not a priority given its retirement — noted, not re-audited in depth
- No CSRF token exists anywhere; risk is currently low because the real backend uses bearer tokens rather than cookies, but the legacy repo's cookie-authenticated routes are CSRF-exposed
- GitHub Actions supply-chain hygiene — covered fully in §19
- 11.7 MB of orphaned upload temp files committed to the legacy repo's `tmp/` directory


## 13. Scalability Audit

*Assuming the stated target of hundreds to thousands of agencies.*

> **[HIGH] Three dashboard endpoints load entire tables into memory to compute simple counts**
>
> **Evidence:** `admin.service.ts:24-27` and `agencies.service.ts:161-164` fetch every rental row for an agency just to `.filter().length` three times; `super-admin.service.ts:40` does the platform-wide equivalent with **no `where` clause at all** — every super-admin dashboard load fetches every rental on the entire platform into API memory.
>
> **Impact:** Guaranteed out-of-memory failure well before "thousands of agencies" — the super-admin endpoint is already unbounded by tenant today.
>
> **Recommendation:** Replace with `groupBy`/aggregate queries; Prisma supports this directly and it is a small, low-risk change per call site.
>
> P1 · Complexity: Small


Additional findings, each already evidenced above: the booking hot-path query has no supporting index and will scan the full rentals table on every reservation attempt (§9); `blockDates` makes one database round trip per date sequentially rather than in a single query, so blocking 90 days is 90 round trips; several list endpoints accept an unbounded `limit` parameter with no server-side cap; base64 images inflate every row and every response payload that includes a car or rental (§6, §10); and the frontend's `/admin/cars` screen fetches the entire unpaginated fleet client-side, which will simply stop working once an agency's fleet grows past a few hundred vehicles.

**Concurrency and idempotency:** the double-booking race (§6) is the single most consequential concurrency gap — it is exactly the failure mode that goes from "never observed" to "routine" as agency count and booking volume rise, because it depends on request timing, not data volume. No write endpoint in either backend implements idempotency keys; retried requests (a common client behavior on flaky mobile connections) can currently double-submit.

**Connection management:** Prisma's connection pool defaults combine multiplicatively with any horizontal replica count; §10 already flags that a move to Supabase specifically requires an explicit `connection_limit` and routing through Supavisor (port 6543) rather than a direct connection, or the platform will exhaust Supabase's connection cap well before it exhausts its compute.


## 14. Durability & Reliability Audit

*What happens when something breaks, and how anyone would find out.*

| Capability | Real backend | Legacy backend | Frontend |
| --- | --- | --- | --- |
| Automated backups | Not configured or documented | Not configured or documented | N/A |
| Point-in-time recovery | None | None | N/A |
| Migration rollback path | None — no migration history exists to roll back (§9) | Single squashed migration, no real history | N/A |
| Health check endpoint | Not confirmed present | Present and correctly wired into Docker/compose (`pages/api/health.js`) | N/A |
| Graceful degradation on backend failure | — | — | No error boundary anywhere (§7) — a backend outage renders as an empty list, not an error state |
| Financial-record durability | Undermined by `onDelete: Cascade` on Rental→Car (§9) | Same pattern | N/A |

The most consequential durability finding is not a missing feature but a design choice already covered in §9: cascading deletes on the one relation that represents realized revenue mean that routine data cleanup (retiring an old vehicle) is currently indistinguishable, at the database level, from destroying financial history. Fixing the cascade behavior and adding soft deletes closes this before it becomes a real incident rather than after.


## 15. Performance Audit

*Backend and frontend, combined.*

### Backend

- **Missing indexes** (§9) — the dominant backend performance issue, invisible today, severe at scale.
- **N+1 in `blockDates`** — one query per date instead of a single batched query (§13).
- **Over-fetching via `include` without `select`** — `rentals.findAll` pulls every car column, including the base64 image field, for every rental on a page.
- **Base64 images inline** — the dominant cost driver: a page of 10 cars can serialize to well over 100 MB of JSON, synchronously, in the Node event loop, before it ever reaches the network.

### Frontend

- **Unpaginated fleet fetch** on `/admin/cars` (§7) — fetches everything, slices client-side.
- **Recharts statically imported** on both dashboard critical paths — a real bundle-size cost paid on first load whether or not the (currently fabricated) charts are useful yet.
- **`useMinLoading`'s 1.2-second artificial floor** directly cancels out a 2-minute cache `staleTime` that was specifically added elsewhere to make cached data feel instant — the two mechanisms were built at different times without reference to each other and now fight.
- **No image resizing before upload** (§7) — the frontend half of the base64 problem; fixing this is worthwhile even independent of any backend/storage change.
- **No cancellation on stale requests** in a few data-fetching call sites — a resolved response from an older request can overwrite a newer one on fast navigation.


## 16. Code Redundancy Audit

*Classified, not assumed — every "unused" claim was verified by a repo-wide grep before being written down.*

### 16.1 — Real backend

| Item | Classification | Reasoning |
| --- | --- | --- |
| Repeated `userAgencyId` guard pattern, 5 call sites | **Actually redundant** | This exact duplication is the mechanism behind the Critical tenancy finding in §5/§6 — one shared guard fixes five copies at once. |
| `CarsService.initializeAvailability()` | **Actually redundant (dead)** | Grep-confirmed zero callers; body is a no-op. Delete. |
| `packages/database/seed-admin.ts` | **Legacy** | Superseded by `prisma/seed.ts`; still uses the pre-rename "Automobelite" identity; not wired to any npm script. |
| `AuthService.getMe` vs `UsersService.getProfile` | **Actually redundant** | Two near-identical implementations behind two routes, with different field sets that disagree — two sources of truth for "who am I." |
| Three rental-listing methods (per-user, per-agency, all) | **Necessary** | Genuinely different scopes and different `include` shapes (the client-facing one deliberately hides other clients' data). Keeping them separate makes the tenancy boundary explicit in the code — worth keeping as-is rather than collapsing. |
| `apps/web/` (empty reserved slot) | **Intentional** | Not a duplicate of `bthg-rental-web` — contains no code. Worth naming as a real strategic option, not a redundancy: folding the frontend into this monorepo would eliminate the SDK file-path/publishing problem (§8, §19) entirely, at the cost of independent frontend deploy cadence. |
| `Notification`, `Parking`, `Maintenance` models with no API surface | **Transitional** | The repo's own README lists these under a "not started" phase — deliberately modeled ahead of implementation, not dead. |

### 16.2 — Legacy backend (retained for the decommissioning decision in §23)

| Item | Classification | Reasoning |
| --- | --- | --- |
| Triplicated CRUD handlers, `admin/*` vs `super-admin/*` | **Intentional in design, actually redundant in implementation** | The scoping difference is a real one line of logic; the implementation copies 100% of the CRUD to express it — and the admin variants have ownership checks the super-admin variants lack, which is exactly where the security holes live. |
| The shared tenant-scoping helper, copy-pasted ~16 times | **Actually redundant, and the direct cause of the security drift** | No two copies agree on whether they return a name or an id; two copies added the query-parameter bypass found in §12; none checks role. |
| Ten near-identical upload handlers | **Actually redundant** | The identical path-traversal vulnerability is copy-pasted ten times — one shared, hardened helper fixes ten Critical findings simultaneously. |
| Three parallel login systems | **Actually redundant** | Same credential store, inconsistent security properties between the copies. |
| The full UI shipped inside this repo, duplicating the separate frontend's purpose | **Transitional — the most consequential item in this list** | Explains several other findings (tenancy-by-name, page-level rather than API-level guarding) and represents real risk of effort being spent twice until formally retired. |

### 16.3 — Frontend

| Item | Classification | Reasoning |
| --- | --- | --- |
| `Sidebar.tsx` + `Navbar.tsx` (256 lines combined) | **Legacy / dead code** | Grep-confirmed: referenced only by the component barrel file, never rendered anywhere. Left over from an earlier navigation design. |
| `StatCardMini`, duplicated byte-identically in both dashboards | **Actually redundant** | A third, general `StatCard` already exists in the shared UI kit; the two dashboard-local copies should use it instead. |
| The two profile pages (admin, super-admin) | **Actually redundant** | ~200 nearly identical lines shared between them — a real candidate for one shared component parameterized by role. |
| 13 separate status/role color-mapping objects across the tree | **Actually redundant** | Same semantic mapping (status → color) reimplemented independently in 13 places; a single shared map removes a whole class of "one place got updated, the others didn't" bugs. |
| Hand-rolled 200-line rentals table | **Actually redundant** | The shared `DataTable` component is already used by six other pages in the same app; this one page didn't adopt it. |
| Five rental-mutation hooks never called by any page | **Transitional (deliberate)** | Built ahead of the missing client-facing product surface (§7) — not dead code, groundwork for a screen that doesn't exist yet. |
| `bcrypt` and `bcryptjs` both present as dependencies (legacy repo cross-reference) | **Actually redundant** | Pick one; having both invites inconsistent hashing behavior across handlers. |


## 17. Technical Debt Assessment

*Ranked by how fast the interest compounds, not by how it feels to read.*

| Debt | System | Compounding rate |
| --- | --- | --- |
| No migration history — every schema change deepens the hole | Real backend | Fast |
| Tenancy logic scattered across ~11 call sites instead of one guard | Real backend | Fast — every new endpoint is another chance to repeat the gap |
| One-admin-per-agency schema ceiling | Real backend | Fast — actively blocks a stated product requirement |
| Zero tests on either backend | Both | Fast — makes every other fix in this report riskier to ship |
| Base64 images in unbounded columns | Both backends + frontend | Fast — compounds directly with data volume and agency count |
| No indexes | Both backends | Fast — compounds directly with data volume |
| Raw Prisma objects returned instead of response DTOs | Real backend | Steady — the direct cause of the `agency`/`Agency` naming drift in §8 |
| SDK version bumps are entirely manual | Real backend | Steady — will eventually be forgotten under deadline pressure |
| Personal-namespace package name | Real backend | Step-function — zero cost until the one day it is a full outage; see §19 |
| Docs describe a system that no longer exists | Legacy | Steady — `docs/ARCHITECTURE.md` documents the NestJS/Turborepo target that `BTHG-Rental-Car-2` became, misleading anyone who onboards from the old repo's docs |
| Authorization implemented by copy-paste, 16 divergent copies | Legacy | Frozen — only matters if the repo stays live; resolved by §23's decommissioning |
| Stale "Automobelite" naming in Swagger/seed data | Real backend | Cosmetic |


## 18. DevOps & Infrastructure Audit

*Docker, environments, and where each system actually runs.*

### Real backend

No Dockerfile exists anywhere in the repository. No documented staging/production separation. Environment configuration is via a standard `.env`, correctly gitignored and never committed (verified via full history scan). No documented deployment target was found in the repository itself — the frontend's `NEXT_PUBLIC_API_URL` default of `http://localhost:4000/api/v1` is the only concrete signal of where the API is expected to run.

### Legacy backend

Has a real `Dockerfile`, `Dockerfile.dev`, and both a production and dev `docker-compose.yml` — more DevOps investment than the repo that superseded it, which is itself a signal that the migration to the new monorepo was cut short before infrastructure was carried over. The committed `DATABASE_URL` ends in `verceldb` on a Neon pooler endpoint — a strong signal the database was auto-provisioned through Vercel's Neon integration, meaning **the production database's lifecycle is currently tied to a Vercel account**, not just a GitHub account (relevant to §19's ownership question). Docker Compose also provisions a Redis service with no client or application code anywhere referencing it — provisioned for a caching plan that was never implemented.

### Environments and secrets

No environment-variable management system (Vault, Doppler, cloud secrets manager) was found in either repository — configuration is plain `.env` files throughout, which is adequate for current scale but is the same mechanism that allowed the legacy repo's secret to be committed in the first place (§12). Transactional email in the legacy system sends through the owner's personal Gmail account via an app password — another personal-account operational dependency, distinct from and in addition to the GitHub/npm one detailed next.


## 19. GitHub & Versioning Workflow Audit

*Your specific question, answered directly, with the mechanism separated from the surrounding personal-account coupling.*

> **Superseded in part — see §31**
>
> §19.4's original recommendation (rename the package to an org scope, publish via GitHub Packages under a company organization) assumed the eventual owner would want a GitHub org either way. A later constraint — a mobile app must share this SDK, and neither a personal GitHub account nor a GitHub organization should be in the dependency path, partly to keep Vercel deploys on the free Hobby tier — changes the answer. §31 is the current recommendation; the diagnosis in §19.1–19.3 (what the workflow does, why it never really needed a personal token, where the coupling actually lives) still stands and is what §31 builds on.


### 19.1 — What exists on GitHub today (verified directly against the API, not inferred from local clones)

|  | `BTHG-Rental-Car` (legacy) | `BTHG-Rental-Car-2` (real backend) | `bthg-rental-web` (frontend) |
| --- | --- | --- | --- |
| Tags | 0 | **1** — `sdk/v1.0.0` | 0 |
| Releases | 0 | 0 | 0 |
| Registered workflows | 2 (deleted from the working tree, still on record from run history) | 1 — `publish-sdk.yml` | 0, ever |
| Workflow runs | 14 total — **all 14 failed**, single 4.5-hour window, one day | 1 total — **succeeded** | — |
| Collaborators | 1 (`Berthonge21`, admin) | 1 (`Berthonge21`, admin) | 1 (`Berthonge21`, admin) |
| Organization | None — personal namespace | None — personal namespace | None — personal namespace |

### 19.2 — How the versioning workflow actually works

> **[GOOD] The publish workflow itself has no personal-token dependency**
>
> **Evidence:** `.github/workflows/publish-sdk.yml`, real backend repo — full contents read directly:
>
> ```
> on:
>   push:
>     tags: ['sdk/v*']       # e.g. sdk/v1.0.0, sdk/v1.2.3
>   workflow_dispatch:
>     inputs:
>       dry_run: { type: boolean, default: false }
> jobs:
>   publish:
>     permissions: { contents: read, packages: write }   # minimal, explicit
>     steps:
>       - uses: actions/checkout@v4
>       - uses: actions/setup-node@v4
>         with: { registry-url: 'https://npm.pkg.github.com', scope: '@berthonge21' }
>       - run: npm install    # in packages/sdk
>       - run: npm run build
>       - run: npm publish
>         env: { NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }} }  # NOT a personal token
> ```


### 19.3 — Where the personal-account dependency actually lives

Five places, none of them the workflow file itself:

1. **The package's own name is the owner's handle.** `packages/sdk/package.json` declares `"name": "@berthonge21/sdk"`. GitHub Packages requires the scope to match the owning account or organization — the package cannot be published under this name by anyone other than this specific account, ever, without a rename.
2. **The registry resolves under the personal namespace.** `https://npm.pkg.github.com` scoped to `@berthonge21` is tied to `github.com/Berthonge21` specifically.
3. **The repository itself is personally owned**, with one collaborator and no organization — a repo-transfer problem independent of any token.
4. **Consumers authenticate with the owner's personal token.** The repository's own `SDK.md` documents `export NPM_TOKEN=$(gh auth token)` as the install instruction — for developers *and*, per the same doc, for the Vercel production build. Because the package is private, every install (local or CI) needs a token scoped to read from this specific account's packages, and today only this account can mint one.
5. **The frontend bypasses all of this and depends on a raw filesystem path instead** (§8) — meaning the publish pipeline described above, however well built, is not even the thing currently making the frontend build fail. Fixing the path without addressing points 1–4 would just move the same personal-account dependency from "invisible because the build already fails" to "the actual blocker."

> **What happens if the account is removed, stated plainly**
>
> The repository disappears from GitHub under that account (or access to it does). `@berthonge21/*` becomes unreachable. Any install — a new developer's laptop, or the Vercel production build — that resolves the SDK through the registry fails, because the `NPM_TOKEN` documented in `SDK.md` is minted from an account that no longer has access. The scope `@berthonge21` cannot be recreated by a successor, because GitHub Packages scopes are bound to account/org names, not to a portable identifier. **This fully confirms your stated concern:** the frontend's ability to build depends on one developer's personal GitHub account remaining active and cooperative — not through the workflow file, but through the package's name and hosting.


### 19.4 — Redesign for a company-owned organization

1. Create a company-owned GitHub organization; transfer both active repositories into it (GitHub repository transfer preserves existing clone URLs as redirects, so this does not break anyone mid-transfer).
2. Rename the package to an org-scoped name — `@bthg-rental/sdk` or similar — and republish under the new scope. This is the one step that cannot be avoided or automated around; it is a deliberate, one-time breaking change to the package identity.
3. Replace every developer's and CI's personal `NPM_TOKEN` with a fine-grained, `read:packages`-scoped token minted from a machine account or, once available, an organization-level token — never from an individual's personal account again.
4. Rewrite `SDK.md` so it stops instructing anyone to run `gh auth token` for install credentials.
5. Fix the frontend's dependency to resolve through the (now org-scoped) registry rather than a relative `file:` path, closing the §8/§7 install failure and the personal-account dependency in the same change.
6. Adopt a version-bump tool that reads Conventional Commits and needs no PAT — **Changesets** or **release-please** both run on `GITHUB_TOKEN` alone and would finally give this workflow the tag-creation step it currently lacks entirely (the workflow publishes on a tag but nothing in either repository currently creates that tag automatically — it has been pushed by hand exactly once).
7. Pin the workflow's third-party actions to commit SHAs rather than floating major-version tags, and add basic build/lint/test CI to the real backend repository, which currently has none at all.

Note on the legacy repository's own CI history, for completeness: its 14 recorded workflow runs all failed, in a single 4.5-hour window, and the workflow files were subsequently deleted from the working tree ("chore: remove CI/CD workflows temporarily") — a removal that has now lasted roughly seven months. That CI attempt used only the automatic `GITHUB_TOKEN` as well; the personal-account coupling in that repository runs through the Vercel-provisioned database (§18) and the personal Gmail sender, not through any workflow secret.


## 20. Testing Assessment

*Stated as plainly as the evidence supports: there is no meaningful automated test coverage anywhere in this platform today.*

| System | Test files found | What they actually verify |
| --- | --- | --- |
| Legacy backend | 4 (3 unit, 1 e2e) | Three of the four define their own subject inline inside the test file and import nothing from the real codebase — they test code that exists only in the test. The fourth, a Playwright e2e spec, is the only file in either backend that exercises real production code, and it covers login-page rendering only. |
| Real backend | 1 e2e spec | `expect(app).toBeDefined()`. Nothing else. |
| Frontend | 0 | No test runner is even configured in `package.json`. |

Coverage of the areas that matter most for this platform's specific risk profile — multi-agency isolation, authorization/RBAC, IDOR, reservation/availability concurrency — is **zero, across every system**. The legacy repo's `jest.config.js` declares a 50% coverage threshold that, given the above, cannot currently pass; its CI history shows this being worked around with a flag that suppresses missing tests but not a failed threshold, which may be part of why CI was ultimately abandoned there.

> **Before any remediation work begins**
>
> This report recommends a substantial number of authorization and tenancy fixes in §6, §12, and §25. None of them should ship without a regression suite that locks in the intended security model first — specifically: a table-driven test asserting that an agency-A admin receives 403 on every agency-B resource, per route; that unauthenticated requests receive 401 across the full route table; that overlapping bookings are rejected under concurrent load; that a client-supplied `total` is ignored server-side; and that `role`/`agencyId` can never be set through a profile-update endpoint. Writing these tests first, against a disposable database, is what makes it safe to touch the authorization code at all.


## 21. Observability Assessment

*If any of the Critical findings in §12 have already been exploited, there is currently no way to know.*

| Capability | Status |
| --- | --- |
| Structured logging | None in either backend — `console.log`/`console.error` only in the legacy repo, and it actively logs a full user row including the password hash on every login. |
| Log aggregation | None. |
| Sensitive-data redaction | None — see the login-logging finding above. |
| Request correlation / tracing | None in either backend. |
| Metrics | None. |
| Error tracking (Sentry or equivalent) | None — a `SENTRY_DSN` variable exists commented-out in the legacy repo's example env file, suggesting it was once planned. |
| Audit log for privileged actions | None, anywhere — there is no way to answer "who cancelled this reservation" or "who changed this agency's status" today. |
| Health check endpoint | Present and correctly wired in the legacy repo's Docker/compose setup; not confirmed present in the real backend. |
| Alerting | None currently active (a Discord deploy-notification step existed in the legacy repo's now-deleted CI workflow). |

Given the severity distribution in §12, this is worth stating as its own risk rather than folding into "general hygiene": the platform cannot currently distinguish between "this vulnerability exists but has never been triggered" and "this vulnerability has already been used." Closing even a minimal slice of this — structured logging with redaction, an error tracker, and one audit-log table for privileged writes — materially changes what the team can say with confidence during and after the P0 remediation in §25.


## 22. Maintainability Assessment

*Where a new engineer would get lost, and where they'd feel immediately at home.*

**Real backend:** genuinely maintainable in its layering — modules, controllers, services, and DTOs are consistently separated, which is exactly what makes the handful of copy-pasted tenancy checks (§16) stand out as the anomaly rather than the norm. The absence of any build/test/lint CI (§19) means that consistency currently depends entirely on code review discipline rather than being enforced automatically. No README beyond scattered docs was found describing the monorepo's own layout for a new contributor.

**Legacy backend:** actively misleading to onboard from. `docs/ARCHITECTURE.md` is a substantial (65KB+) document describing the NestJS/Turborepo/Chakra target architecture in real detail — down to example controllers and DTOs — none of which is what the repository actually contains. A new engineer reading the docs before the code would form an entirely wrong mental model, including false assurance that concerns like rate limiting and pagination are handled, when §12 confirms neither is true in this repository. This is a direct byproduct of the migration to `BTHG-Rental-Car-2` having happened in practice without the old repo's documentation being updated or the repo being formally retired.

**Frontend:** no README exists. A new contributor has no written guide to the three-repo topology, the SDK dependency's actual purpose, or the fact that authorization here is intentionally UX-only. Given how much of this report's synthesis in §8 depended on reconstructing that topology from evidence rather than documentation, a short README covering exactly those three things is disproportionately high-leverage relative to its cost.


## 23. Critical Risks & Blockers

*The handful of things that gate everything else.*

> **[CRITICAL] The frontend cannot be built today**


> **[CRITICAL] There is no customer-facing product in any of the three repositories**


> **[CRITICAL] Live credentials are in the legacy repo's git history**


> **[CRITICAL] Two independent double-booking / price-tampering paths, one per backend**


> **[HIGH] The frontend's ability to build depends on one person's GitHub account**


> **[HIGH] No migration history exists for the schema that matters going forward**


## 24. Recommended Target Architecture

*Not a rewrite — the target the system is already most of the way toward.*

> **Revised — see §31**
>
> The diagram below still shows the SDK reaching the frontend through a published, org-scoped registry package, which was the right target under the original brief. Given the mobile + no-GitHub-org constraint added afterward, §31 now supersedes that one edge: the near-term target routes web (and, later, mobile) to the SDK through a monorepo workspace rather than any registry. Everything else in this diagram — the tenancy fix, the migration history, Supabase — is unaffected.


The right target is close to what already exists in `BTHG-Rental-Car-2` and `bthg-rental-web`, hardened rather than replaced: a NestJS API behind a fail-closed global auth guard (already true), a properly-scoped tenancy layer instead of five copy-pasted checks (a fix, not a redesign), a Prisma/PostgreSQL database with a real migration history and the missing index set, moved onto Supabase for managed Postgres, Storage, and backups (§10), and consumed by the frontend through a normally-published, org-scoped SDK package rather than a relative filesystem path.

*[Diagram: Target architecture diagram — see the published report for the visual: https://claude.ai/code/artifact/ccdfedc3-9f3e-4101-8ae0-b71efa072d0e#s24]*

Two structural additions beyond hardening the existing pieces: a real client-facing booking surface (the missing product half, §7, §23), and a thin tenancy middleware/guard layer that becomes the single place agency scoping is decided — replacing the five duplicated checks in the real backend and, if the legacy repo's UI is ever revived instead of archived, the sixteen duplicated copies there.


## 25. P0 — Critical Improvements

*Do these before anything else. Several can happen the same day, in parallel, by different people.*

- Rotate the legacy repo's committed database password, `JWT_SECRET`, `NEXTAUTH_SECRET`, and email app password; then `git rm --cached .env` (§1, §12).
- Fix the frontend's SDK dependency path so the project can be installed and built at all (§7, §8).
- Fix the tenancy guard's silent no-op for agency-less admins in the real backend — the single highest-leverage security fix in the report (§5, §6).
- Add `AgencyUser.agencyId` to the schema, resolving the one-admin-per-agency ceiling that causes the above (§5, §6, §9).
- Move rental price computation server-side; stop trusting a client-supplied `total` (§6, §12).
- Wrap the booking availability check and create in a transaction, and add the PostgreSQL exclusion constraint that actually prevents the race under concurrency (§6, §13).
- Fail startup if `JWT_SECRET` is missing or matches the known default fallback; add a distinct `tokenType` claim so a refresh token cannot be used as an access token (§6, §11).
- Remove the schema-mutating `db:deploy` step from the `dev` pipeline, and baseline a real migration history (§6, §9).
- Add the minimum viable index set, especially on the tenant discriminator and the booking hot path (§9, §13).
- Replace the fabricated `Math.random()` revenue chart with an honest empty state until a real endpoint exists (§7).
- Write the authorization/tenancy regression suite before making any of the above changes to authorization code (§20).
- If the legacy repo stays live even temporarily: disable or delete `super-admin/register.js` and fix `agent-reset-password.js`'s missing token check — the two most severe live findings in that repository (§6, §12).


## 26. P1 — High Priority Improvements

- Add ownership checks to `GET /agencies/:id/stats` and the availability calendar; fix the client/admin id collision on generic `/rentals` (§6, §12).
- Add `@nestjs/throttler` globally, with tighter limits on auth routes; strip admin emails from the public agencies endpoint (§6, §12).
- Encode and enforce the rental status transition graph server-side (§4, §6).
- Add the four missing endpoints the frontend is already compensating for: get-one-admin/user, and a real revenue time-series endpoint (§7, §8, §22).
- Fix the four confirmed SDK contract lies — `register()`'s return shape, `assignAgency()`'s return type, and the two omitted-but-typed-as-required profile fields (§8).
- Move image uploads to Supabase Storage with signed URLs; drop the 15 MB body limit once that lands (§6, §10).
- Add a frontend error boundary and render real error states from failed queries instead of indistinguishable-from-empty states (§7).
- Add client-side image compression before upload, independent of the storage migration (§7, §15).
- Replace the three memory-loading dashboard endpoints with aggregate queries (§13).
- Begin the GitHub organization migration: transfer both active repos, rename the SDK package to an org scope, replace personal tokens with a scoped machine-account token (§19).
- Fix `onDelete: Cascade` on `Rental → Car`; add timestamps to `Rental`/`Maintenance`; fix `updatedAt` to `@updatedAt` (§9).
- Split the legacy repo's `docs/ARCHITECTURE.md` into a clearly labeled historical document, or remove it, before any new engineer can be misled by it (§22).


## 27. P2 — Medium Priority Improvements

- Add `@@unique([agencyId, registration])` to prevent duplicate vehicle records (§9).
- Add soft deletes to `Car`, `Agency`, `Rental`, `Parking` (§9, §14).
- Add a global Prisma result extension or `omit` config so password hashes are structurally excluded from every response, rather than relying on developers remembering to hand-build return objects (§9).
- Delete the redundant seed script and compiled seed artifacts; align bcrypt cost between the two (§9).
- Consolidate the 13 duplicated frontend status/role color maps into one shared source (§16).
- Merge the two near-identical frontend profile pages into one, parameterized by role (§16).
- Adopt the shared `DataTable` component on the one page that hand-rolls its own table (§16).
- Add basic build/lint/test CI to the real backend repository, which currently has none (§19).
- Add structured logging with redaction, an error tracker, and one audit-log table for privileged actions (§21).
- Write a short README for each active repository covering the three-repo topology and, for the frontend, the explicit statement that its authorization checks are UX, not security (§22).


## 28. P3 — Long-Term Improvements

- Build the client-facing booking product surface — the largest single scope item in this report, and the one that turns this from a back-office into the rental platform it's meant to be (§7, §23).
- Introduce Supabase Row Level Security as a defense-in-depth backstop once the schema and application-level tenancy fixes are in place — not as a replacement for either (§10).
- Evaluate folding the frontend into the backend's Turborepo monorepo, eliminating the SDK publishing/distribution question entirely, against the cost of losing an independent frontend deploy cadence (§16).
- Introduce a scheduled-job runner (e.g. Supabase's pg_cron) for rental lifecycle transitions such as auto-completing past-due rentals (§10).
- Formally archive the legacy repository once its credential rotation is confirmed and any residual value (its architecture docs, as a historical record) has been extracted or clearly labeled (§17, §23, §24).
- Upgrade Next.js past the version range affected by CVE-2025-29927 and add real security headers/CSP across the frontend (§7, §12).


## 29. Recommended Implementation Sequence

*Ordered by dependency, not by section number.*

1. **Day 0 — Incident response, no dependencies.** Rotate the legacy repo's leaked credentials. This does not block or depend on anything else in this list and should not wait for planning.
2. **Week 1 — Unblock everything else.** Fix the frontend's SDK path (or point it at the registry directly). Nothing involving the frontend can be verified until this lands.
3. **Week 1 — Write the safety net before touching authorization code.** The tenancy/authorization regression suite from §20. Every fix in the next step should run against it.
4. **Weeks 1–2 — The core security and integrity fixes.** Tenancy guard fix + `AgencyUser.agencyId`; server-side price computation; the booking transaction and exclusion constraint; the JWT secret and token-type fixes. These are interdependent — the schema change and the guard fix should land together, verified by the regression suite from the previous step.
5. **Weeks 2–3 — Database foundation.** Baseline the migration history, then add the index set, in that order — indexes should go through the newly-established migration path, not another ad hoc `db push`.
6. **Weeks 3–4 — Close the remaining High findings.** Ownership checks on the two leaking endpoints, rate limiting, the status-transition graph, the SDK contract fixes.
7. **Month 2 — Infrastructure and ownership.** The Supabase migration (now sitting on a real migration history and a fixed schema) and the GitHub organization transfer with SDK rename can proceed in parallel — neither blocks the other, though the org transfer is the more time-sensitive one relative to your original concern.
8. **Month 2 onward — Product.** Once the platform underneath it is trustworthy, begin the client-facing booking surface — the largest remaining scope item, and the one that should not start on a foundation still carrying the P0 findings above it.


## 30. Final Architecture/Technical Assessment

*The one-paragraph version, for anyone who reads nothing else.*

This is a platform in transition that was never formally declared to have transitioned: a real, reasonably well-engineered NestJS backend and a clean frontend already exist and are the right foundation to build on, but a legacy monolith with a live credential leak is still sitting in the org unretired, the frontend cannot currently be installed, and the new backend's single most consequential bug — a tenancy guard that silently does nothing for exactly the admin accounts its own schema allows to exist — sits directly beside genuinely careful work like a JWT strategy that correctly refuses to trust its own tokens. None of the problems found here require rearchitecting what exists; they require finishing it: one schema fix that resolves a cluster of critical findings at once, a migration history that has simply never been started, and an honest acknowledgment that the customer-facing half of "rental platform" hasn't been built yet. The Supabase direction is sound and the database was never the obstacle. The GitHub ownership concern is real, precisely diagnosed in §19, and fixable with a deliberate one-time change rather than an emergency. Fix the P0 list, and this becomes a platform worth building the next year on top of rather than one still being excavated from underneath.


## 31. Addendum — SDK Distribution for Web + Mobile, Without a GitHub Org

*A follow-up constraint that changes the SDK-distribution recommendation in §19 and §24, added after the initial audit.*

> **The constraint, restated**
>
> A mobile app is planned. Web and mobile should consume one shared SDK rather than each reimplementing the API client and business types. The SDK's distribution must depend on **neither your personal GitHub account nor a GitHub organization** — partly because of the original bus-factor concern from §19, and now also because connecting a GitHub organization to Vercel tends to push a project into Vercel's Team context, which risks the free Hobby tier you're planning to deploy on. Nothing should cost money or add infrastructure before it's needed, and whatever is built now should still upgrade cleanly to a proper org-owned setup once there's budget and a team.


### 31.1 — A technical correction to the original recommendation

§19.4 originally recommended publishing the SDK via GitHub Packages under a renamed, org-scoped package. That recommendation doesn't survive this constraint — and not only because of the Vercel-billing concern. **GitHub Packages' npm registry requires a GitHub-scoped authentication token to install a package regardless of whether the repository or the package is public.** That is a property of GitHub Packages itself, not of personal-versus-organization ownership. So "rename the scope to an org" was never actually going to produce a package any laptop could install with zero setup — it would only have swapped whose personal token gated the install. The real fix is getting off GitHub Packages entirely, for a different and more fundamental reason than the one originally identified.

### 31.2 — What the SDK actually needs to be

Re-reading the original ask: the goal was never "a published package" for its own sake. It was **one place the API client and domain types live, so an update to it reaches every consumer without being re-implemented per platform.** A package registry is one way to satisfy that. It is not the only way, and it is not the cheapest way while there is only one consuming team and no need for independent release cadences yet.

### 31.3 — Phase 1 (now): monorepo workspace, no registry at all

*[Diagram: Phase 1 architecture: monorepo workspace linking, no registry — see the published report for the visual: https://claude.ai/code/artifact/ccdfedc3-9f3e-4101-8ae0-b71efa072d0e#s31]*

Concretely:

1. Move `bthg-rental-web` into the already-reserved, currently-empty `apps/web` slot inside `BTHG-Rental-Car-2` (§3, §16 both already noted this slot exists and flagged folding the frontend in as a genuine option).
2. Change the SDK dependency from the broken `file:` path (§7, §8) to `"@bthgrentalcar/sdk": "workspace:*"` — Yarn/pnpm/npm workspaces resolve this locally at install time. This fixes the current P0 "frontend can't install" finding as a direct side effect of adopting this architecture, not as a separate task.
3. Point Vercel's project at this repo with **Root Directory** set to `apps/web` — standard, documented, free-tier-supported monorepo behavior; Vercel's own build system is Turborepo-aware and only rebuilds what changed.
4. Keep the repository under your personal GitHub account. No organization enters the picture, so Vercel's import flow stays in its normal personal/Hobby path rather than the org-triggered Team flow.
5. When mobile work starts, add `apps/mobile` (Expo is the lowest-friction starting point) to the same repo. Metro, React Native's bundler, has first-class monorepo/workspace support, and Turborepo publishes an official example in exactly this shape — this is a well-trodden pattern, not a workaround.

Net effect: one shared SDK, consumed identically by web and (later) mobile, with **zero** registries, tokens, npm accounts, or GitHub identities of any kind in the loop. This is the cheapest possible version of "shared SDK" and it is also, right now, the correct one — there is no second team and no independent release cadence yet that would justify anything more.

### 31.4 — Phase 2 (later): public npm, only once there's a reason to decouple

The trigger for this phase is a real one: mobile and web need to ship on different schedules, a separate team owns one of them, or an external party needs to consume the API. None of that is true yet. When it is:

- Publish `packages/sdk` to the **public npm registry** (registry.npmjs.org) under a scoped name, e.g. `@bthg-rentalcar/sdk`.
- An npmjs.com account is its own identity system — it is not a GitHub account, does not require "Sign in with GitHub," and costs nothing for unlimited public packages.
- Installing a public npm package needs **no authentication at all** — `yarn add @bthg-rentalcar/sdk` works on any laptop, in any CI, including a future mobile build service (EAS or equivalent), with nothing to configure. This is the actual property the original §19 recommendation was reaching for and GitHub Packages structurally cannot provide.
- `.github/workflows/publish-sdk.yml` already does the correct thing mechanically — checkout, install, build, verify `dist/`. Only the registry URL and the publish credential (an npm access token instead of `GITHUB_TOKEN`) change; the workflow's shape, its tag trigger, and its minimal `permissions` block all carry over.
- The one real tradeoff: the package's source (typed HTTP bindings and domain types) becomes publicly downloadable. Given §8 already established the SDK carries no business logic — that stays server-side — this is a low-cost tradeoff, and is exactly how companies with public APIs (Stripe, Twilio, and similar) ship their own SDKs.

At this point, moving the repositories into a GitHub organization also becomes low-risk to reconsider on its own timeline — GitHub org membership itself is free regardless of repo count or visibility; it is specifically *Vercel's* handling of org-connected projects that motivated staying personal in Phase 1, and that becomes a separate, budget-driven decision once a paid Vercel plan is already worth it for other reasons.

### 31.5 — One caveat, stated once

Vercel's Hobby tier terms restrict it to non-commercial personal use. If BTHG becomes a paying product, a paid Vercel plan will eventually be necessary regardless of how the GitHub side is structured — that's a separate trigger from the one this addendum solves, worth knowing about now rather than discovering at the point it matters.


---

*Prepared from three independent, parallel investigations plus direct verification against GitHub's API and primary source files. No code, configuration, dependency, schema, or workflow was modified in the course of this audit.*
