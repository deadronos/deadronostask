import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { TaskList } from '@/components/TaskList';
import type { Doc, Id } from '@/convex/_generated/dataModel';
import { mockUseMutationReturn, mockUseQueryReturn } from '../utils/mocks/convex';

vi.mock('@/components/LabelChips', () => ({
  LabelChips: ({ onChange }: { onChange?: (value: Id<'labels'>[]) => void }) => (
    <button type="button" onClick={() => onChange?.(['label-1' as Id<'labels'>])}>
      Filter Labels
    </button>
  ),
}));

vi.mock('@/components/TaskItem', () => ({
  TaskItem: ({ task }: { task: Doc<'tasks'> }) => <div data-testid="task-item">{task.title}</div>,
}));

vi.mock('@/components/TaskEditorDialog', () => ({
  TaskEditorDialog: ({ open }: { open: boolean }) => (open ? <div>Editor</div> : null),
}));

const baseTask = {
  isCompleted: false,
  description: '',
  dueDate: null,
  labelIds: [],
} as Partial<Doc<'tasks'>>;

describe('TaskList', () => {
  it('filters tasks by priority', async () => {
    const user = userEvent.setup();
    mockUseQueryReturn([]);
    mockUseMutationReturn(vi.fn());

    const tasks = [
      {
        ...baseTask,
        _id: 'task-low' as Id<'tasks'>,
        title: 'Low priority task',
        priority: 'low',
      } as Doc<'tasks'>,
      {
        ...baseTask,
        _id: 'task-high' as Id<'tasks'>,
        title: 'High priority task',
        priority: 'high',
      } as Doc<'tasks'>,
    ];

    render(<TaskList title="Today" subtitle="Focus" tasks={tasks} allowReorder={false} />);

    expect(screen.getAllByTestId('task-item')).toHaveLength(2);
    await user.selectOptions(screen.getByLabelText('Priority'), 'high');

    expect(screen.getAllByTestId('task-item')).toHaveLength(1);
    expect(screen.getByText('High priority task')).toBeInTheDocument();
  });

  it('filters tasks by selected labels', async () => {
    const user = userEvent.setup();
    mockUseQueryReturn([]);
    mockUseMutationReturn(vi.fn());

    const labelId = 'label-1' as Id<'labels'>;
    const tasks = [
      {
        ...baseTask,
        _id: 'task-labeled' as Id<'tasks'>,
        title: 'Needs label',
        priority: 'med',
        labelIds: [labelId],
      } as Doc<'tasks'>,
      {
        ...baseTask,
        _id: 'task-unlabeled' as Id<'tasks'>,
        title: 'No label',
        priority: 'med',
        labelIds: [],
      } as Doc<'tasks'>,
    ];

    render(<TaskList title="Inbox" subtitle="All tasks" tasks={tasks} allowReorder={false} />);

    expect(screen.getAllByTestId('task-item')).toHaveLength(2);
    await user.click(screen.getByRole('button', { name: 'Filter Labels' }));

    expect(screen.getAllByTestId('task-item')).toHaveLength(1);
    expect(screen.getByText('Needs label')).toBeInTheDocument();
  });
});
