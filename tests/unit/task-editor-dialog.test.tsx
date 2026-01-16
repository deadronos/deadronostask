import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { TaskEditorDialog } from '@/components/TaskEditorDialog';
import type { Doc, Id } from '@/convex/_generated/dataModel';
import { toast } from 'sonner';
import { useQueryMock, useMutationMock } from '../utils/mocks/convex';

// Helpers: use `useQueryMock` and `useMutationMock` provided by `tests/utils/mocks/convex` for per-test control.
function mockMutations(createMock: any, updateMock: any) {
  useMutationMock.mockReturnValueOnce(createMock).mockReturnValueOnce(updateMock);
}

function mockQueries(projects: any[], labels: any[]) {
  useQueryMock.mockReturnValueOnce(projects).mockReturnValueOnce(labels);
}

describe('TaskEditorDialog', () => {
  it('prefills fields and updates an existing task', async () => {
    const user = userEvent.setup();
    const createMock = vi.fn();
    const updateMock = vi.fn();
    // Ensure the correct mutation handler is returned depending on the path
    useMutationMock.mockImplementation((m: any) => {
      if (m === 'tasks.create') return createMock;
      if (m === 'tasks.update') return updateMock;
      return vi.fn();
    });

    const projectId = 'project-1' as Id<'projects'>;
    const labelId = 'label-1' as Id<'labels'>;

    // Ensure correct values based on the query arg (more robust than ordered mockReturnValueOnce)
    useQueryMock.mockImplementation((q: any) => {
      if (q === 'projects.list') return [{ _id: projectId, name: 'Marketing' } as Doc<'projects'>];
      if (q === 'labels.list')
        return [{ _id: labelId, name: 'Design', color: '#0EA5E9' } as Doc<'labels'>];
      return undefined;
    });

    const dueLocal = new Date(2026, 1, 1, 12, 0, 0).getTime();
    const initialTask = {
      _id: 'task-1' as Id<'tasks'>,
      title: 'Review brief',
      description: 'Check scope and goals',
      priority: 'high',
      dueDate: dueLocal,
      projectId,
      labelIds: [labelId],
    } as Doc<'tasks'>;

    const onOpenChange = vi.fn();

    render(
      <TaskEditorDialog
        open
        onOpenChange={onOpenChange}
        initialTask={initialTask}
        defaultProjectId={projectId}
      />,
    );

    expect(screen.getByLabelText('Title')).toHaveValue('Review brief');
    expect(screen.getByLabelText('Description')).toHaveValue('Check scope and goals');
    expect(screen.getByLabelText('Priority')).toHaveValue('high');
    expect(screen.getByLabelText('Project')).toHaveValue(projectId);
    expect(screen.getByLabelText('Due date')).toHaveValue('2026-02-01');

    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(updateMock).toHaveBeenCalledWith({
      id: initialTask._id,
      patch: {
        title: 'Review brief',
        description: 'Check scope and goals',
        priority: 'high',
        dueDate: new Date('2026-02-01').getTime(),
        projectId,
        labelIds: [labelId],
      },
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('shows an error when title is missing', async () => {
    const user = userEvent.setup();
    const createMock = vi.fn();
    const updateMock = vi.fn();
    useMutationMock.mockReturnValueOnce(createMock).mockReturnValueOnce(updateMock);
    useQueryMock.mockReturnValueOnce([]).mockReturnValueOnce([]);

    const onOpenChange = vi.fn();
    render(<TaskEditorDialog open onOpenChange={onOpenChange} />);

    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(toast.error).toHaveBeenCalledWith('Title is required');
    expect(createMock).not.toHaveBeenCalled();
  });
});
