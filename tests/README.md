# Testing guidelines ✅

Quick reference for unit tests in this repo (React + TypeScript + Convex).

## Where the globals live

- **Global setup & mocks:** `tests/setup.ts` (runs before tests)

- **Convex mock helpers:** `tests/utils/mocks/convex.ts` (exposes `useQueryMock`, `useMutationMock`, `mockUseQueryReturn`, `mockHttpClientQueryReturn`, `resetConvexMocks`)

---

## Test categories

- **Unit** (`tests/unit/`) — fast, no network, mock Convex and server code.

- **Integration** (`tests/integration/`) — run against a local `npx convex dev` instance; slower.

- **E2E** (`tests/e2e/`) — Playwright against an app + backend environment.

---

## Mocking Convex (recommended) 🔧

- Use global mocks from `tests/setup.ts` (already mock `convex/react`, `convex/browser`, and `@/convex/_generated/api`).

- For per-test behavior, use helpers in `tests/utils/mocks/convex.ts`.

Examples:

- Mock `useQuery` return for a single test:

```ts
import { mockUseQueryReturn } from 'tests/utils/mocks/convex';

// inside test
mockUseQueryReturn([{ _id: 'p1', name: 'Marketing' }]);
```

- Mock `useQuery` more robustly by inspecting the query arg:

```ts
import { useQueryMock } from 'tests/utils/mocks/convex';
useQueryMock.mockImplementation(q => {
  if (q === 'projects.list') return [{ _id: 'p1', name: 'Marketing' }];
  if (q === 'labels.list') return [{ _id: 'l1', name: 'Design', color: '#0EA5E9' }];
  return undefined;
});
```

- Mock the HTTP client:

```ts
import { mockHttpClientQueryReturn } from 'tests/utils/mocks/convex';
mockHttpClientQueryReturn({ some: 'result' });
```

- Reset mocks between tests (setup already calls `resetConvexMocks()` in `beforeEach`).

---

## Assertion style & best practices ✅

- Follow Arrange — Act — Assert (one behavior per test).

- Prefer user-centric queries: `getByRole`, `getByLabelText`, `getByText` (accessibility-focused).

- Use testing-library assertions: `toHaveTextContent`, `toHaveValue`, `toHaveLength`, `toBeInTheDocument`.

- Avoid asserting implementation details (internal state or exact hook calls) unless the behavior depends on them.

- For interactions, use `userEvent.setup()` and `await` the actions (e.g., `await user.click(...)`, `await user.type(...)`).

- Keep tests deterministic: set fixed dates, seeded values, and avoid timers unless explicitly tested (use `vi.useFakeTimers()` where needed).

Example:

```ts
// Arrange
render(<MyComponent />);
const user = userEvent.setup();

// Act
await user.type(screen.getByLabelText('Search tasks'), 'roadmap');

// Assert
expect(screen.getByTestId('query')).toHaveTextContent('roadmap');
```

---

## Troubleshooting

- If a test hangs or triggers real network activity, ensure:
  - `convex/react` & `convex/browser` are mocked in `tests/setup.ts`.

  - Any server-only module (for example `@/convex/_generated/api`) is mocked.

- Use the helpers in `tests/utils/mocks/convex.ts` to control per-test returns and to reset mocks.

---

If you'd like, I can add a small CI `integration` job that starts `npx convex dev` and runs integration tests; or expand these notes into a `CONTRIBUTING.md` section. Which would you prefer next? 🧭
