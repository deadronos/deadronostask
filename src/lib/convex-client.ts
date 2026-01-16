// Thin re-export module for Convex's client-side helpers so tests and code
// can import a stable path of '@/lib/convex-client'. Exporting directly from
// `convex/react` and `convex/browser` makes it easy to mock in tests.

export { useQuery, useMutation } from 'convex/react';

// Re-export the browser client for direct access in tests if needed.
export { ConvexHttpClient } from 'convex/browser';
