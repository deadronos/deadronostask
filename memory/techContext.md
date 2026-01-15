# Tech Context

**Stack**

- Frontend: Next.js (App Router), React 19+, TypeScript
- Backend: Convex (serverless functions, realtime sync)
- Auth: NextAuth
- Styling: Tailwind CSS
- Testing: Vitest (unit), Playwright (E2E)
- Tooling: Vite, ESLint, Prettier

**Dev commands**

- Start dev: `npm run dev`
- Lint: `npm run lint`
- Tests: `npm run test` (unit), `npx playwright test` (E2E)

**Repository notes**

- Keep Convex business logic tested and minimal in return values.
- No secrets in repo; use environment variables for deployment.
- Memory bank maintained in `/memory` as source-of-truth for design & tasks.
