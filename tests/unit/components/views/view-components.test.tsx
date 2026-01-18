import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { TaskCalendarView } from '@/components/views/calendar-view';
import { TaskListView } from '@/components/views/list-view';
import { TaskTimelineView } from '@/components/views/timeline-view';
import { type Doc, type Id } from '@/convex/_generated/dataModel';

// Mock dependencies
vi.mock('convex/react', async () => {
  return {
    useQuery: vi.fn(() => []), // Return empty labels
    useMutation: vi.fn(() => vi.fn()),
  };
});

// Mock Next.js router/link/image if needed, but components seem pure enough.

const mockTasks: (Doc<'tasks'> & { labelIds?: Id<'labels'>[] })[] = [
  {
    _id: 'task1' as Id<'tasks'>,
    _creationTime: Date.now(),
    ownerClerkUserId: 'user1',
    title: 'Test Task 1',
    status: 'todo',
    priority: 1,
    order: 1,
    archived: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    dueAt: Date.now() + 86_400_000,
  },
  {
    _id: 'task2' as Id<'tasks'>,
    _creationTime: Date.now(),
    ownerClerkUserId: 'user1',
    title: 'Test Task 2',
    status: 'done',
    priority: 2,
    order: 2,
    archived: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

describe('View Components', () => {
  describe('TaskListView', () => {
    it('renders tasks correctly', () => {
      render(<TaskListView tasks={mockTasks} />);
      expect(screen.getByText('Test Task 1')).toBeInTheDocument();
      expect(screen.getByText('Test Task 2')).toBeInTheDocument();
    });

    it('renders empty state', () => {
      render(<TaskListView tasks={[]} />);
      expect(screen.getByText('No tasks found.')).toBeInTheDocument();
    });
  });

  describe('TaskCalendarView', () => {
    it('renders tasks in calendar', () => {
      render(<TaskCalendarView tasks={mockTasks} />);
      // Calendar renders task titles in buttons.
      // Depending on previous tests cleanup, we might find multiple elements or just the button.
      // We use getAllByText to be safe.
      const elements = screen.getAllByText('Test Task 1');
      expect(elements.length).toBeGreaterThan(0);
    });
  });

  describe('TaskTimelineView', () => {
    it('renders tasks in timeline', () => {
      render(<TaskTimelineView tasks={mockTasks} />);
      expect(screen.getAllByText('Test Task 1')[0]).toBeInTheDocument();
      // Timeline renders sidebar and bars.
    });
  });
});
