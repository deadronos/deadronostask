import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TaskItem } from '@/components/TaskItem';
import type { Doc, Id } from '@/convex/_generated/dataModel';
import { useMutation } from 'convex/react';

vi.mock('convex/react', () => ({
  useMutation: vi.fn(),
}));

const useMutationMock = vi.mocked(useMutation);

const baseTask = {
  _id: 'task-1' as Id<'tasks'>,
  title: 'Finish quarterly plan',
  description: 'Outline goals and milestones',
  isCompleted: false,
  priority: 'low',
  dueDate: null,
  labelIds: [],
} as Doc<'tasks'>;

describe('TaskItem', () => {
  beforeEach(() => {
    useMutationMock.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders priority, due date, and labels', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-15T12:00:00Z'));

    const labelId = 'label-1' as Id<'labels'>;
    const label = {
      _id: labelId,
      name: 'Design',
      color: '#0EA5E9',
    } as Doc<'labels'>;

    const task = {
      ...baseTask,
      dueDate: new Date('2026-01-14T12:00:00Z').getTime(),
      labelIds: [labelId],
    } as Doc<'tasks'>;

    useMutationMock.mockReturnValue(vi.fn());

    render(<TaskItem task={task} labelById={new Map([[labelId, label]])} onEdit={vi.fn()} />);

    expect(screen.getByText('Finish quarterly plan')).toBeInTheDocument();
    expect(screen.getByText('LOW')).toBeInTheDocument();

    const dueLabel = new Date(task.dueDate as number).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
    const dueBadge = screen.getByText(dueLabel);
    expect(dueBadge).toHaveClass('bg-danger');
    expect(screen.getByText('Design')).toBeInTheDocument();
  });

  it('toggles completion when checkbox is clicked', async () => {
    const user = userEvent.setup();
    const toggleMock = vi.fn();
    const removeMock = vi.fn();
    useMutationMock.mockReturnValueOnce(toggleMock).mockReturnValueOnce(removeMock);

    render(<TaskItem task={baseTask} labelById={new Map()} onEdit={vi.fn()} />);

    const checkbox = screen.getByLabelText('Mark complete');
    await user.click(checkbox);

    expect(toggleMock).toHaveBeenCalledWith({ id: baseTask._id });
  });
});
