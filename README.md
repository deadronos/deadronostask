# Task Manager – Next.js + Convex + Clerk + tRPC

A modern, realtime task manager built with Next.js App Router, Convex, Clerk, and tRPC. It supports per-user data isolation, realtime updates, and is deployable on Vercel with Convex deployment during build.

## Features

- Authentication with Clerk (OAuth and email/password)
- Convex realtime database + server functions
- tRPC for service endpoints and integrations
- Per-user authorization on every query/mutation
- Projects, tasks, priorities, due dates, and ordering
- Realtime updates across all clients
- Clean, organized folder structure with all source in `/src`

## Tech Stack

- Next.js 16 App Router + TypeScript
- Tailwind CSS v4
- Convex for realtime backend
- Clerk for authentication
- tRPC for service endpoints
- Zod for validation
- convex-helpers for auth utilities

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
- `CONVEX_DEPLOYMENT` (optional, for production)
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (from Clerk dashboard)
- `CLERK_SECRET_KEY` (from Clerk dashboard)

### 3) Configure Clerk

1. Create a Clerk application at https://clerk.com
2. Enable authentication providers (Email, Google, GitHub, etc.)
3. In Clerk dashboard, go to JWT Templates
4. Create a new template named **`convex`** (this is required for Convex integration)
5. Copy your publishable and secret keys to `.env.local`

### 4) Run locally (two terminals)

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

Convex will automatically sync with Clerk when you have the JWT template configured.

Optional: Set `CLERK_JWT_ISSUER_DOMAIN` in Convex dashboard if using a custom domain.

## Vercel Deployment

1. Push the repo to GitHub and import it in Vercel.
2. Add these **Vercel** environment variables (Production):

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `CONVEX_DEPLOY_KEY` (create in Convex dashboard)

3. Set the Vercel **Build Command**:

```bash
npx convex deploy --cmd 'npm run build' --cmd-url-env-var-name NEXT_PUBLIC_CONVEX_URL
```

## Repository Layout

```
src/
  app/
    layout.tsx                    # Root layout with Clerk and Convex providers
    page.tsx                      # Home page (redirects to dashboard or sign-in)
    (auth)/
      sign-in/[[...sign-in]]/
        page.tsx                  # Clerk sign-in page
      sign-up/[[...sign-up]]/
        page.tsx                  # Clerk sign-up page
    (app)/
      layout.tsx                  # Protected app layout with tRPC
      dashboard/
        page.tsx                  # Dashboard with overview
      projects/
        [projectId]/
          page.tsx                # Project detail page
      settings/
        page.tsx                  # Settings page
    api/
      trpc/
        [trpc]/
          route.ts                # tRPC route handler
  convex/
    schema.ts                     # Convex database schema
    auth.config.ts                # Clerk integration config
    users.ts                      # User functions
    projects.ts                   # Project functions
    tasks.ts                      # Task functions
    lib/
      auth.ts                     # Auth helper functions
  lib/
    convex/
      ConvexClientProvider.tsx    # Convex client setup
    trpc/
      client.tsx                  # tRPC client setup
    utils/
      cn.ts                       # Utility functions
  server/
    trpc/
      context.ts                  # tRPC context with Clerk auth
      procedures.ts               # Public and protected procedures
      router.ts                   # tRPC router with example endpoints
  styles/
    globals.css                   # Global styles
  middleware.ts                   # Clerk middleware for auth
convex.json                       # Convex config pointing to src/convex
tsconfig.json                     # TypeScript config with @/* alias
package.json                      # Dependencies
```
