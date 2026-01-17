# AGENTS

## 🤖 Brief operating instructions

This repository is maintained with a specification-driven workflow and explicit agent guidance. If you are an automated agent (Codex, Gemini, or any other automation) doing work here, **you MUST** read the project-level guidance before taking actions.

### 🔴 Mandatory reading (first step)

- **Open and read:** `#file:copilot-instructions.md` (in `.github/`) — this is the project's authoritative guidance and contains required patterns, constraints, and conventions agents must follow.

> **Why:** The `copilot-instructions.md` file contains project-specific rules (Next.js App Router patterns, Convex conventions, testing and linting expectations, security reminders). Following it prevents breaking changes, style drift, and CI failures.

---

### 🚀 Development Server Setup

To run the application locally for development, testing, or evaluation, you need to start **both** services in separate background terminals:

1. **Start Convex dev server** (real-time database backend):

   ```bash
   npx convex dev
   ```

   - This starts the Convex backend which handles real-time data synchronization
   - Must be running before the Next.js dev server
   - Keep this terminal running in the background

2. **Start Next.js dev server** (frontend application):

   ```bash
   npm run dev
   ```

   - This starts the Next.js application on `http://localhost:3000` (default)
   - Requires Convex dev server to be running first
   - Keep this terminal running in the background

**Important Notes:**

- Both servers must be running simultaneously for the application to work properly
- The Convex dev server should be started first to ensure the backend is ready
- For automated testing (e.g., Playwright), ensure both servers are running before executing tests
- The development site will be accessible at `http://localhost:3000` or `http://127.0.0.1:3000`

---

### ✅ Quick pre-action checklist

Before making changes or committing anything, do the following:

1. **Read** `#file:copilot-instructions.md` and the repository `/.github/instructions/` as needed. ✅

2. **Validate locally**: run `npm run lint` and `npm run format` (or the equivalent project commands). Fix auto-fixable issues. ✅

3. **Run tests** (unit, integration, Playwright) if the task touches runtime behavior or business logic. ✅

4. **Keep diffs small and focused**. Make multiple small commits for larger work and document the reasoning. ✅

5. **Update memory bank** under `/memory` for new tasks, designs, or decisions. ✅

---

### ✍️ Pull request & commit guidance

- Use concise PR titles and a 3-line PR summary (Goal, Key changes, Validation) as described in the spec-driven workflow.

- Include tests and a brief validation instruction (what commands you ran and expected output).

- Prefer non-breaking changes unless explicitly authorized.

---

### ⚠️ Safety, security, and style

- Never add secrets, credentials, or PII in commits or code.

- Follow the linter and Prettier configuration present in the repo. If you must change them, justify and document the decision in the PR.

- If you need to add or change Git hooks (Husky), ensure the hooks are compatible with future versions and avoid deprecated patterns.

---

### 🔁 When blocked or uncertain

- If a rule or behavior is ambiguous, open a short issue titled `agent-question: <one-line>` and include the minimal reproduction and proposed options.

- Avoid unilateral changes to broad configurations (eslint, CI, infra) without approval from a project maintainer.

---

### 📝 Agent accountability

- Document any non-obvious decisions in a short note in the PR and update the relevant file in `/memory` (e.g., `tasks/` or `designs/`).

- Read eslint.config.mjs and tsconfig.json.
  Run npm run lint and npm run -s typecheck locally; fail the change if either command reports errors or any ESLint warnings.
  Ensure all new or modified functions use the appropriate Convex context types (QueryCtx for reads, MutationCtx for writes) and avoid any`.
  Include a one-line Lint/Typecheck result in the PR description (e.g., “lint: OK — 0 warnings; typecheck: OK”).

---

Thank you for following the project's conventions. Read `#file:copilot-instructions.md` now and continue only after you fully understand the constraints.
