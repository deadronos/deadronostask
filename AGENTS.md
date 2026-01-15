# AGENTS

## 🤖 Brief operating instructions

This repository is maintained with a specification-driven workflow and explicit agent guidance. If you are an automated agent (Codex, Gemini, or any other automation) doing work here, **you MUST** read the project-level guidance before taking actions.

### 🔴 Mandatory reading (first step)

- **Open and read:** `#file:copilot-instructions.md` (in `.github/`) — this is the project's authoritative guidance and contains required patterns, constraints, and conventions agents must follow.

> **Why:** The `copilot-instructions.md` file contains project-specific rules (Next.js App Router patterns, Convex conventions, testing and linting expectations, security reminders). Following it prevents breaking changes, style drift, and CI failures.

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

- If you automated a change (fix, format, migration), attach a short log of commands you ran and their outputs.

---

Thank you for following the project's conventions. Read `#file:copilot-instructions.md` now and continue only after you fully understand the constraints.
