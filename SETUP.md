## Quick Setup Guide

### Prerequisites

- Node.js 18+ installed
- A Clerk account (https://clerk.com)
- A Convex account (https://convex.dev)

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Setup Clerk

1. Create a new application at https://clerk.com
2. Enable your preferred authentication providers (Email, Google, GitHub, etc.)
3. Go to JWT Templates in the Clerk dashboard
4. Create a new template named **`convex`** (this is required)
5. Copy your API keys

### Step 3: Setup Convex

1. Install Convex CLI: `npm install -g convex`
2. Login: `npx convex login`
3. Create a project: `npx convex dev`
4. This will create a `.env.local` file with `NEXT_PUBLIC_CONVEX_URL`

### Step 4: Configure Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```bash
# From Convex (created by npx convex dev)
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud

# From Clerk Dashboard
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

### Step 5: Run Development Servers

You need two terminals:

Terminal 1 - Convex Backend:

```bash
npx convex dev
```

Terminal 2 - Next.js Frontend:

```bash
npm run dev
```

### Step 6: Access the Application

Open http://localhost:3000 in your browser. You'll be redirected to sign in.

### Troubleshooting

**Problem: Convex types not generated**

- Solution: Make sure `npx convex dev` is running. The types are automatically generated.

**Problem: Authentication not working**

- Solution: Verify your Clerk JWT template is named exactly `convex`
- Check that both API keys are correctly set in `.env.local`

**Problem: Database queries failing**

- Solution: Make sure Convex dev server is running
- Check that `NEXT_PUBLIC_CONVEX_URL` matches your Convex deployment

### Production Deployment

See README.md for detailed production deployment instructions for Vercel.
