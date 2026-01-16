import { z } from 'zod';

import { router, publicProcedure, protectedProcedure } from './procedures';

export const appRouter = router({
  health: publicProcedure.query(() => {
    return { status: 'ok' };
  }),

  // Example integration procedure
  integrations: router({
    github: router({
      importIssues: protectedProcedure
        .input(
          z.object({
            repo: z.string(),
            projectId: z.string().optional(),
          }),
        )
        .mutation(async ({ input: _input }) => {
          // This would integrate with GitHub API to import issues
          // For now, it's a placeholder
          return {
            success: true,
            message: 'GitHub integration not yet implemented',
          };
        }),
    }),
  }),

  tasks: router({
    batchArchive: protectedProcedure
      .input(z.object({ taskIds: z.array(z.string()) }))
      .mutation(async ({ input }) => {
        // This would call Convex to archive multiple tasks
        // For now, it's a placeholder
        return {
          success: true,
          archived: input.taskIds.length,
        };
      }),
  }),

  projects: router({
    seedDefaults: protectedProcedure
      .input(z.object({ projectId: z.string() }))
      .mutation(async ({ input: _input }) => {
        // This would seed default tasks for a project
        // For now, it's a placeholder
        return {
          success: true,
          message: 'Seeding not yet implemented',
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
