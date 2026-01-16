# Taskflow – Next.js + Convex + Auth.js Task Manager

A modern, realtime task manager built with Next.js App Router, Convex, and Auth.js (NextAuth v5). It supports per-user data isolation, realtime updates, and is deployable on Vercel with Convex deployment during build.

## Features

- OAuth sign-in with GitHub (Auth.js v5)
- Convex realtime database + server functions
- Convex-verified JWTs for authenticated access
- Per-user authorization on every query/mutation
- Projects, labels, priorities, due dates, and ordering
- Responsive sidebar + mobile drawer
- Theme + default view settings

## Tech Stack

- Next.js App Router + TypeScript
- Tailwind CSS
- Convex (`convex`)
- Auth.js / NextAuth v5
- `jose` for JWT signing
- `convex-helpers` for adapter endpoint protection

## Local Development

### 1) Install dependencies

```bash
npm install
```

### 2) Create environment file

Copy `.env.example` to `.env.local` and fill in values.

```bash
cp .env.example .env.local
```

Required values:

- `NEXT_PUBLIC_CONVEX_URL` (created by `npx convex dev`)
- `AUTH_SECRET` (use `npx auth secret` or `openssl rand -base64 32`)
- `AUTH_GITHUB_ID`
- `AUTH_GITHUB_SECRET`
- `CONVEX_AUTH_PRIVATE_KEY`
- `CONVEX_AUTH_ADAPTER_SECRET`

### 3) Generate keys (JWKS + private key)

```bash
node src/generateKeys.mjs
```

- Paste `CONVEX_AUTH_PRIVATE_KEY` into `.env.local`
- Paste `JWKS` into your Convex dashboard environment variables

### 4) Configure GitHub OAuth

Create a GitHub OAuth app and set:

- Callback URL (local): `http://localhost:3000/api/auth/callback/github`
- Callback URL (prod): `https://<project>.vercel.app/api/auth/callback/github`

### 5) Run locally (two terminals)

Terminal 1:

```bash
npx convex dev
```

Terminal 2:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Convex Environment Variables

Set these in the Convex dashboard (both Development and Production environments):

- `JWKS` (from `generateKeys.mjs`)
- `CONVEX_AUTH_ADAPTER_SECRET` (same value as `.env.local`)

`CONVEX_SITE_URL` is provided by Convex automatically and is used by `src/convex/auth.config.ts`.

## Vercel Deployment

1. Push the repo to GitHub and import it in Vercel.
2. Add these **Vercel** environment variables (Production):

- `AUTH_SECRET`
- `AUTH_GITHUB_ID`
- `AUTH_GITHUB_SECRET`
- `CONVEX_AUTH_PRIVATE_KEY` (paste the raw multi-line PEM, or replace line breaks with `\n` and remove surrounding quotes)
- `CONVEX_AUTH_ADAPTER_SECRET`

3. Create a Convex deploy key and set in Vercel:

- `CONVEX_DEPLOY_KEY`

4. In the Convex dashboard (Production), set:

- `JWKS`
- `CONVEX_AUTH_ADAPTER_SECRET`

5. Set the Vercel **Build Command**:

```bash
npx convex deploy --cmd 'npm run build' --cmd-url-env-var-name NEXT_PUBLIC_CONVEX_URL
```

## Repository Layout

```
src/
  generateKeys.mjs
  auth.ts
  app/
    layout.tsx
    page.tsx
    api/auth/[...nextauth]/route.ts
    app/
      layout.tsx
      today/page.tsx
      inbox/page.tsx
      projects/page.tsx
      projects/[projectId]/page.tsx
      completed/page.tsx
      settings/page.tsx
  components/
    AppShell.tsx
    Sidebar.tsx
    Topbar.tsx
    TaskList.tsx
    TaskItem.tsx
    TaskEditorDialog.tsx
    ProjectList.tsx
    LabelChips.tsx
    SearchBox.tsx
    Toaster.tsx
  convex/
    schema.ts
    http.ts
    auth.config.ts
    authAdapter.ts
    tasks.ts
    projects.ts
    labels.ts
    lib/auth.ts
  middleware.ts
```
