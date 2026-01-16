# Task Manager — High-Level Architecture & Spec (v0.1)

**Target stack:** Next.js (App Router) + TypeScript + Clerk + Convex + tRPC

**Hosting:** Vercel (Next.js app) + Convex hosted deployment

**Repo policy:** All application source code lives under `/src`.

---

## 1) Goals

- Build a task management web app with fast CRUD, filters/search, and a clean UI.
- Use **Convex** for realtime data (queries/mutations) so changes appear immediately in subscribed clients.
- Use **tRPC** for “server-only service endpoints” (integrations, orchestration, privileged operations).
- Use **Clerk** for authentication and user/session management.
- Keep a strict, predictable folder layout with **all source under `/src`**.

---

## 2) High-level Architecture

### 2.1 Component view

- **Next.js UI (Vercel)**
  - Server Components for routing/layout + initial render.
  - Client Components for interactive task UI (board/list), forms, optimistic UX.
  - Clerk for auth UI + identity.

- **Convex backend**
  - Schema + functions (queries/mutations/actions).
  - Realtime subscriptions to power the UI.

- **tRPC API (Next.js Route Handler)**
  - Runs inside the Next.js deployment (Vercel) as `/api/trpc/*`.
  - Uses Clerk identity from server context.
  - Calls external services and/or coordinates multi-step workflows.

### 2.2 Data/API responsibility split (recommended)

**Convex = “product data plane”**

- Tasks/projects/labels CRUD
- Realtime list queries
- Authorization checks for all reads/writes

**tRPC = “service plane”**

- Integrations (e.g., import GitHub issues → create tasks)
- Batch operations and orchestration
- Webhook receivers (optional)
- “Privileged” endpoints that should never be callable directly from the browser without server mediation

---

## 3) Repository Contract (All source under `/src`)

### 3.1 Allowed root-level folders/files

Keep only project configuration and public assets at repo root:

- `/public` (Next.js convention)
- `package.json`, lockfile
- `next.config.*`
- `tsconfig.json`
- `.env.local` (and other `.env.*`)
- `convex.json` (Convex config)
- lint/format configs (eslint/prettier)

Next.js explicitly supports the `src` directory pattern for `app/` and other application code. (See Next.js `src` folder convention.)

### 3.2 Target folder layout

```txt
.
├─ public/
├─ src/
│  ├─ app/
│  │  ├─ layout.tsx
│  │  ├─ (app)/
│  │  │  ├─ dashboard/
│  │  │  │  └─ page.tsx
│  │  │  ├─ projects/[projectId]/page.tsx
│  │  │  └─ settings/page.tsx
│  │  ├─ (auth)/
│  │  │  ├─ sign-in/[[...sign-in]]/page.tsx
│  │  │  └─ sign-up/[[...sign-up]]/page.tsx
│  │  └─ api/
│  │     └─ trpc/[trpc]/route.ts
│  ├─ components/
│  ├─ convex/
│  │  ├─ schema.ts
│  │  ├─ auth.config.ts
│  │  ├─ users.ts
│  │  ├─ projects.ts
│  │  ├─ tasks.ts
│  │  └─ _generated/
│  ├─ lib/
│  │  ├─ convex/
│  │  ├─ trpc/
│  │  └─ utils/
│  ├─ server/
│  │  ├─ trpc/
│  │  │  ├─ context.ts
│  │  │  ├─ router.ts
│  │  │  └─ procedures.ts
│  │  └─ integrations/
│  ├─ styles/
│  └─ types/
├─ convex.json
├─ next.config.ts
├─ tsconfig.json
└─ package.json
```

Notes:

- `src/app/...` uses Next.js App Router in the `src` layout.
- Convex functions live in `src/convex/` (see `convex.json` below).
- tRPC route handler lives in `src/app/api/trpc/[trpc]/route.ts`.

---

## 4) Required Configuration

### 4.1 Convex folder location (`convex.json`)

Convex supports changing the backend folder location via the `functions` field.

```json
{
  "$schema": "./node_modules/convex/schemas/convex.schema.json",
  "functions": "src/convex/"
}
```

### 4.2 TypeScript import alias (`tsconfig.json`)

Use `@/*` → `src/*` so imports stay stable:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

### 4.3 Clerk middleware/proxy file under `/src`

Clerk’s Next.js quickstart notes that when using the `/src` directory, the middleware/proxy file should also be placed inside `/src`.

- If using **Next.js ≤ 15**: create `src/middleware.ts`
- If using **newer Clerk guidance** that prefers `proxy.ts`: create `src/proxy.ts`

Keep the matcher configured to run for both normal pages and API routes (`/(api|trpc)(.*)`), so that auth state is available where needed.

### 4.4 tRPC App Router entrypoint

Mount tRPC using a Next.js **Route Handler**:

- `src/app/api/trpc/[trpc]/route.ts`

tRPC documents Next.js adapter patterns and supports App Router usage via fetch adapters/route handlers.

---

## 5) Authentication & Identity

### 5.1 Clerk in Next.js

- Wrap the app with `<ClerkProvider>` in `src/app/layout.tsx`.
- Protect routes using Clerk middleware/proxy.

### 5.2 Clerk → Convex

Use Convex’s Clerk integration provider (recommended) so the Convex client is authenticated with Clerk.

- Client side: wrap Convex provider with Clerk and use `ConvexProviderWithClerk`.
- Server side: configure `src/convex/auth.config.ts` to validate Clerk tokens.
- Clerk JWT template must be named **`convex`** (Convex expects this by default when fetching Clerk tokens).

### 5.3 Clerk → tRPC

- Build `src/server/trpc/context.ts` to derive auth from Clerk server helpers.
- Provide `publicProcedure` and `protectedProcedure` helpers in `src/server/trpc/procedures.ts`.
- Ensure the tRPC provider is rendered under `<ClerkProvider>` so client calls can access auth context (Clerk tRPC guide).

---

## 6) Data Model (MVP)

### 6.1 Ownership model

MVP is **personal workspace**:

- Every record is owned by a single Clerk user.
- Store `ownerClerkUserId: string` on every row (simple and direct).
- Never accept `ownerClerkUserId` from clients; derive it from auth.

### 6.2 Tables (Convex)

**users**

- `clerkUserId` (unique)
- `email?`, `name?`, `avatarUrl?`
- `createdAt`, `updatedAt`

**projects**

- `ownerClerkUserId`
- `name`
- `archived: boolean`
- `createdAt`, `updatedAt`

**tasks**

- `ownerClerkUserId`
- `projectId?: Id<'projects'> | null`
- `title`
- `description?`
- `status: 'todo' | 'doing' | 'done'`
- `priority: 0 | 1 | 2 | 3`
- `dueAt?: number` (timestamp)
- `order: number` (manual ordering key)
- `archived: boolean`
- `createdAt`, `updatedAt`

(Optionally later)

- **labels** + `labelIds` on tasks

### 6.3 Indexing (Convex)

- `projects.by_owner(ownerClerkUserId)`
- `tasks.by_owner(ownerClerkUserId)`
- `tasks.by_owner_project(ownerClerkUserId, projectId)`
- `tasks.by_owner_status(ownerClerkUserId, status)`
- `tasks.by_owner_due(ownerClerkUserId, dueAt)`

---

## 7) Backend API Contract

### 7.1 Convex functions (primary CRUD + realtime)

**Users**

- `users.upsertMe()` — ensure user row exists/updated
- `users.getMe()` — return current user

**Projects**

- `projects.list()`
- `projects.create({ name })`
- `projects.update({ projectId, patch })`
- `projects.archive({ projectId })`

**Tasks**

- `tasks.list({ projectId?, status?, search?, includeArchived? })`
- `tasks.create({ projectId?, title, description?, priority?, dueAt? })`
- `tasks.update({ taskId, patch })`
- `tasks.setStatus({ taskId, status })`
- `tasks.reorder({ taskId, order })`
- `tasks.archive({ taskId })`

**Validation rules (server-side)**

- Title required, trimmed, max length
- Patch updates whitelist only (no arbitrary field writes)
- Ownership checks on every query/mutation

### 7.2 tRPC procedures (service endpoints)

Examples:

- `integrations.github.importIssues({ repo, projectId })`
- `tasks.batchArchive({ taskIds })`
- `projects.seedDefaults({ projectId })`

Rules:

- tRPC procedures should be **protected** by default when they affect user data.
- tRPC may call Convex (server-side) to write/query, but should not duplicate CRUD that the client can do via Convex directly.

---

## 8) Frontend (Next.js) Structure

### 8.1 Routes (App Router)

- `/dashboard` — overview (today, upcoming, quick add)
- `/projects/[projectId]` — project scoped list/board
- `/settings` — account/settings

### 8.2 UI building blocks

- `ProjectSidebar` (client): subscribe to `projects.list`
- `TaskList` / `KanbanBoard` (client): subscribe to `tasks.list`
- `TaskEditor` (client): create/update via mutations
- `FiltersBar` (client): status/priority/due/search

### 8.3 State policy

- Convex queries are the source of truth.
- Local React state is only for transient UI state (forms, modals, temporary filters).

---

## 9) Deployment (Vercel + Convex)

### 9.1 Environment variables

**Convex** (typical names; Next.js public vars must be prefixed):

- `NEXT_PUBLIC_CONVEX_URL` (Convex deployment URL; recommended naming for Next.js)
- `CONVEX_DEPLOYMENT` (dev/prod deployment identifier)

**Clerk**

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- (If needed) Clerk domain/issuer vars per your Clerk instance

### 9.2 Notes

- Add the same env vars in **Vercel Project Settings**.
- Convex deployment is managed separately via the Convex CLI/dashboard.

---

## 10) Milestones (MVP)

- **M1** Scaffold Next.js in `/src` layout, TS strict, lint/format
- **M2** Clerk auth + protected routes
- **M3** Convex schema + auth config, basic users/projects/tasks functions
- **M4** Dashboard UI with realtime task list + CRUD
- **M5** Filters/search + ordering
- **M6** tRPC setup + one integration procedure (e.g., GitHub import)
- **M7** Polish: empty states, error handling, basic tests

---

## 11) References (docs used for this spec)

```txt
Next.js src folder convention:
- https://nextjs.org/docs/app/api-reference/file-conventions/src-folder

Convex: changing convex/ folder location via convex.json functions:
- https://docs.convex.dev/production/project-configuration

Clerk Next.js quickstart (notes about /src for proxy/middleware and matcher incl. /(api|trpc)(.*)):
- https://clerk.com/docs/nextjs/getting-started/quickstart

Clerk + tRPC guide:
- https://clerk.com/docs/guides/development/trpc

Convex + Clerk integration (ConvexProviderWithClerk):
- https://docs.convex.dev/auth/clerk

Convex auth debugging note about Clerk token template name "convex":
- https://docs.convex.dev/auth/debug

Convex env var naming for Next.js (NEXT_PUBLIC_CONVEX_URL):
- https://docs.convex.dev/client/react/deployment-urls
```
