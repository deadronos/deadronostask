# idea.md — Next.js + Convex + Auth.js (NextAuth v5) Task Manager (Vercel *.vercel.app friendly)

You are an autonomous coding agent (e.g. Codex CLI). Generate a **complete, runnable repository** for a modern task manager web app.

## Goal

Build a **fully featured task manager** with:

- **Next.js App Router** + **TypeScript**
- **Convex** for realtime database + server functions
- **Auth.js (NextAuth v5)** for authentication (OAuth + optional Email)
- Deployable on **Vercel**, including Convex deployment during build
- Works on the default Vercel domain: `https://<project>.vercel.app`

The repo must run locally with:

- `npm install`
- `npx convex dev` (in one terminal)
- `npm run dev` (in another terminal)

---

## Non‑negotiables (implementation must match these patterns)

### A) Auth.js App Router wiring

- Create `auth.ts` that exports `{ handlers, signIn, signOut, auth }` via `NextAuth(...)` (v5 style).
- Create `app/api/auth/[...nextauth]/route.ts` that re-exports route handlers:

  - `export const { GET, POST } = handlers`

- Add middleware to keep sessions alive and to protect authenticated routes:
  - Basic: `export { auth as middleware } from "@/auth"`
  - Protection: use `auth((req)=>{ if(!req.auth) redirect })` pattern on `/app(.*)`.

### B) Auth.js + Convex authentication (JWT issued by Next.js, verified by Convex)

Use the Convex “NextAuth adapter” approach:
- Next.js issues a signed JWT (“convexToken”) in the Auth.js `session` callback.
- Convex validates the token using a public key served from **Convex HTTP routes** (`/.well-known/jwks.json` and `/.well-known/openid-configuration`).
- Convex auth config uses `domain: process.env.CONVEX_SITE_URL` and `applicationID: "convex"` (audience).

### C) Auth.js uses Convex as its database adapter

Implement the Convex adapter endpoints and the Auth.js models in Convex:
- Tables: `users`, `accounts`, `sessions`, `verificationTokens`, `authenticators`
- Indexes as required by Auth.js models
- An adapter secret `CONVEX_AUTH_ADAPTER_SECRET` must be required for calling adapter endpoints.

### D) Per-user authorization in Convex functions

Every app query/mutation must:
1) `const identity = await ctx.auth.getUserIdentity();`
2) Throw if unauthenticated
3) Use `identity.subject` (the Convex user id) for ownership checks, and only access rows owned by that user.

---

## Product requirements

### Routes

- `/` — public landing page (marketing + “Sign in” CTA)
- `/app/*` — authenticated app shell + views:
  - `/app/today` — due today + overdue tasks
  - `/app/inbox` — all open tasks without a project
  - `/app/projects` — projects list
  - `/app/projects/[projectId]` — project detail (open tasks in project)
  - `/app/completed` — completed tasks (restore supported)
  - `/app/settings` — basic settings (theme, default view)

### Task features

Each task supports:
- `title` (required)
- `description` (optional, markdown allowed)
- `isCompleted` boolean
- `priority`: `"low" | "med" | "high"`
- `dueDate`: `number | null` (ms timestamp)
- `projectId`: `Id<"projects"> | null`
- `labelIds`: `Id<"labels">[]`
- ordering within a project (numeric `order`)
- `createdAt`, `updatedAt`

### Project features

- Create/rename/delete projects
- `color` + `icon` (strings)
- ordered in sidebar

### Label features

- Create/rename/delete labels
- Filter tasks by label(s)

### UX / quality bar

- Responsive: sidebar on desktop, drawer on mobile
- Accessible: keyboard, focus, ARIA labels
- Realtime updates (Convex)
- Optimistic updates for common actions
- Empty states, loading states, error toasts

---

## Tech stack

- Next.js App Router, TypeScript
- Tailwind CSS
- shadcn/ui + lucide-react (preferred)
- Convex (`convex` npm package)
- Auth.js / NextAuth v5 (`next-auth` beta/current per Auth.js docs)
- `jose` for keypair generation and JWT signing
- `convex-helpers` for adapter endpoint protection (customQuery/customMutation)

---

## Required repository layout (suggested)

- `app/`
  - `layout.tsx` (root providers, global CSS)
  - `page.tsx` (landing)
  - `api/auth/[...nextauth]/route.ts`
  - `app/` (authenticated segment)
    - `layout.tsx` (app shell, passes session to providers)
    - `today/page.tsx`
    - `inbox/page.tsx`
    - `projects/page.tsx`
    - `projects/[projectId]/page.tsx`
    - `completed/page.tsx`
    - `settings/page.tsx`
- `components/`
  - `AppShell.tsx`, `Sidebar.tsx`, `Topbar.tsx`
  - `TaskList.tsx`, `TaskItem.tsx`, `TaskEditorDialog.tsx`
  - `ProjectList.tsx`, `LabelChips.tsx`, `SearchBox.tsx`
  - `Toaster.tsx` (or a toast library wrapper)
- `convex/`
  - `schema.ts`
  - `http.ts` (JWKS + openid-configuration endpoints)
  - `auth.config.ts`
  - `authAdapter.ts` (Auth.js adapter endpoints)
  - `tasks.ts`, `projects.ts`, `labels.ts`
  - `lib/auth.ts` (helpers like `requireUserId`)
- Root:
  - `auth.ts` (Auth.js config + JWT issuing)
  - `middleware.ts`
  - `generateKeys.mjs`
  - `README.md`
  - `.env.example`

---

## Auth.js setup details (implement)

### 1) `auth.ts`

- Configure at least one provider:
  - GitHub OAuth (required for “works out of the box”)
  - Optional: Email provider (Resend) if you want passwordless login
- Use `adapter: ConvexAdapter` (your adapter module)
- In `callbacks.session`, issue a Convex JWT called `convexToken`:

  - `issuer` must be the Convex “site” URL:
    - `const CONVEX_SITE_URL = NEXT_PUBLIC_CONVEX_URL.replace(/\.cloud$/, ".site")`
  - `audience` must be `"convex"`
  - set `sub: session.userId`
  - expiration ~1 hour

- Extend the Session type so `session.convexToken` is typed.

### 2) `app/api/auth/[...nextauth]/route.ts`

- `import { handlers } from "@/auth"`
- `export const { GET, POST } = handlers`

### 3) `middleware.ts`

- Must protect `/app(.*)` routes:
  - If user is not authenticated, redirect to `/`
  - Keep session alive by using the Auth.js middleware pattern

---

## Convex auth verification (implement)

### 1) Keypair generation: `generateKeys.mjs`

- Use `jose` to generate an RS256 key pair.
- Output:
  - `CONVEX_AUTH_PRIVATE_KEY="...pkcs8..."`
  - `JWKS='{"keys":[...]}`
- Developers paste:
  - private key into `.env.local` (Next.js server)
  - JWKS into Convex dashboard env var `JWKS`

### 2) Convex HTTP endpoints: `convex/http.ts`

Expose:

- `GET /.well-known/openid-configuration`
  - JSON with `issuer`, `jwks_uri`, and an `authorization_endpoint` placeholder
- `GET /.well-known/jwks.json`
  - return `process.env.JWKS` (must exist)
  - add caching headers

### 3) Convex auth config: `convex/auth.config.ts`

- Configure provider with:
  - `domain: process.env.CONVEX_SITE_URL`
  - `applicationID: "convex"`

This makes Convex validate JWTs issued by your Next.js server using the JWKS served from Convex.

---

## Convex Auth.js adapter (implement)

### 1) Schema additions in `convex/schema.ts`

Implement the Auth.js adapter tables exactly as the Auth.js adapter model expects:
- `users` (index: `email`)
- `sessions` (indexes: `sessionToken`, `userId`)
- `accounts` (indexes: `providerAndAccountId`, `userId`)
- `verificationTokens` (index: `identifierToken`)
- `authenticators` (indexes: `userId`, `credentialID`)

Then define your app tables below those.

### 2) Adapter endpoints in `convex/authAdapter.ts`

Implement all endpoints necessary for the Auth.js Adapter interface, and secure them using a shared secret:

- Every adapter query/mutation requires `{ secret: string }`
- Compare it to `process.env.CONVEX_AUTH_ADAPTER_SECRET`
- Reject if missing or wrong

Use `convex-helpers` custom functions for this (customQuery/customMutation), then implement endpoints like:
- `createUser`, `getUser`, `getUserByEmail`, `getUserByAccount`, `updateUser`, `deleteUser`
- `linkAccount`, `unlinkAccount`, `getAccount`
- `createSession`, `getSessionAndUser`, `updateSession`, `deleteSession`
- `createVerificationToken`, `useVerificationToken`
- Authenticators methods (create/get/list/update counter)

### 3) Next.js “ConvexAdapter” module

Create an adapter module in Next.js (e.g. `app/ConvexAdapter.ts` or `lib/ConvexAdapter.ts`) that implements the Auth.js adapter by calling the Convex endpoints above using the adapter secret. Keep it server-only.

---

## App data model (Convex)

### Ownership

Use `identity.subject` as the user id (this should be the `Id<"users">` from Auth.js adapter). Store as:

- `ownerId: Id<"users">`

### Tables

#### `projects`
- ownerId: Id<"users">
- name: string
- color: string
- icon: string
- order: number
- createdAt: number
- updatedAt: number
Indexes:
- by_owner_order: (ownerId, order)
- by_owner_name: (ownerId, name)

#### `labels`
- ownerId: Id<"users">
- name: string
- color: string
- createdAt: number
- updatedAt: number
Indexes:
- by_owner_name: (ownerId, name)

#### `tasks`
- ownerId: Id<"users">
- title: string
- description: string
- isCompleted: boolean
- priority: "low" | "med" | "high"
- dueDate: number | null
- projectId: Id<"projects"> | null
- labelIds: Id<"labels">[]
- order: number
- createdAt: number
- updatedAt: number
Indexes:
- by_owner_updatedAt: (ownerId, updatedAt)
- by_owner_project_order: (ownerId, projectId, order)
- by_owner_dueDate: (ownerId, dueDate)
- by_owner_completed: (ownerId, isCompleted)

---

## Convex app API (implement all)

### `convex/lib/auth.ts`
Provide helpers:

- `requireUserId(ctx): Promise<Id<"users">>`:
  - calls `ctx.auth.getUserIdentity()`
  - throws if null
  - returns `identity.subject as Id<"users">`

- `assertOwned(doc, ownerId)` helper for readable checks

### projects
- `list()`
- `create({ name, color, icon })`
- `rename({ id, name })`
- `reorder({ orderedIds })`
- `remove({ id })` (also unassign tasks.projectId = null)

### labels
- `list()`
- `create({ name, color })`
- `rename({ id, name })`
- `remove({ id })` (also remove from tasks.labelIds)

### tasks
- `listInbox()` (open tasks where projectId is null)
- `listByProject({ projectId })`
- `listToday()` (open tasks due today OR overdue)
- `listCompleted()` (completed, recent first)
- `search({ query })` (simple contains in title/description)
- `create({ title, description?, dueDate?, priority, projectId?, labelIds? })`
- `update({ id, patch })` (whitelist fields)
- `toggleComplete({ id })`
- `reorderInProject({ projectId, orderedIds })` (also allow `projectId=null` inbox ordering)
- `remove({ id })`

Security for each: enforce `ownerId` matches, never leak other users’ docs.

---

## Frontend implementation notes

### Providers

Create a client provider that supplies:
- `SessionProvider` (from `next-auth/react`) with a `session` prop passed from server layout
- `ConvexProviderWithAuth` with a `useAuth` hook that returns:
  - `isAuthenticated`
  - `isLoading`
  - `fetchAccessToken({ forceRefreshToken })` → returns `session.convexToken` (and uses `update()` when force-refresh)

Root layout:
- Minimal public provider wrapping
- Authenticated layout (`app/app/layout.tsx`) should:
  - call `const session = await auth()` on the server
  - pass it down to the client provider wrapper

### UI

Build a cohesive UI:
- App shell layout: sidebar + topbar + main
- Sidebar:
  - nav links (Today, Inbox, Projects, Completed, Settings)
  - projects section (create, reorder)
  - labels section
- Topbar:
  - search input (task search)
  - sign out button
- Task list views:
  - filters (project, labels, priority, due date)
  - task editor dialog for create/edit

Prefer mostly client components inside `/app/*` so hooks work naturally.

---

## Environment variables

### `.env.local` (Next.js)

Required:
- `NEXT_PUBLIC_CONVEX_URL` (created by `npx convex dev`)
- `AUTH_SECRET` (random, required by Auth.js)
- `AUTH_GITHUB_ID`
- `AUTH_GITHUB_SECRET`
- `CONVEX_AUTH_PRIVATE_KEY` (generated by `node generateKeys.mjs`)
- `CONVEX_AUTH_ADAPTER_SECRET` (random shared secret used to call Convex adapter endpoints)

Optional (email magic links):
- `AUTH_RESEND_KEY` (or whichever Email provider key you implement)

### Convex dashboard env vars (Development + Production deployments)

Required:
- `JWKS` (generated)
- `CONVEX_AUTH_ADAPTER_SECRET` (same secret as Next.js)

---

## Local development steps (must document in README)

1) Create Next.js + Convex:
   - `npx create-next-app@latest ...`
   - `npm install convex`
   - `npx convex dev`
2) Install auth deps:
   - `npm install next-auth jose convex-helpers`
3) Generate keys:
   - `node generateKeys.mjs`
   - Put `CONVEX_AUTH_PRIVATE_KEY` into `.env.local`
   - Put `JWKS` into Convex dashboard env vars
4) Create secrets:
   - `AUTH_SECRET` (via `npx auth secret` or openssl)
   - `CONVEX_AUTH_ADAPTER_SECRET` (random)
5) Configure GitHub OAuth:
   - callbacks:
     - `http://localhost:3000/api/auth/callback/github`
     - `https://<project>.vercel.app/api/auth/callback/github`
6) Run:
   - `npx convex dev`
   - `npm run dev`

---

## Vercel deployment (must document in README)

1) Push repo to GitHub and import into Vercel
2) In Vercel env vars (Production):
   - `AUTH_SECRET`
   - `AUTH_GITHUB_ID`
   - `AUTH_GITHUB_SECRET`
   - `CONVEX_AUTH_PRIVATE_KEY`
   - `CONVEX_AUTH_ADAPTER_SECRET`
3) Create a Convex **deploy key** and set Vercel env var:
   - `CONVEX_DEPLOY_KEY`
4) In Convex dashboard env vars (Production deployment):
   - `JWKS`
   - `CONVEX_AUTH_ADAPTER_SECRET`
5) Vercel Build Command:
   - `npx convex deploy --cmd 'npm run build' --cmd-url-env-var-name NEXT_PUBLIC_CONVEX_URL`

---

## Deliverables

Output the complete repository content.

- Provide a file tree and the full contents for each file
- No TODO placeholders for core functionality
- Clean TypeScript (no `any`)
- `README.md` must be complete: setup + deploy steps
- UI should be minimal but polished and usable

If something is optional (like email login), implement it only if it does not slow down delivering the full task manager.
