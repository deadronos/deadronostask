import { describe, expect, it } from 'vitest';

import { formatTaskDate } from '@/lib/utils/dates';
import { calculateNewOrder, getMaxOrder } from '@/lib/utils/ordering';
import { getNextStatus } from '@/lib/utils/tasks';

const missingValue = Reflect.get({}, 'missing');

describe('task utility helpers', () => {
  describe('calculateNewOrder', () => {
    it('returns the midpoint when both neighbors exist', () => {
      expect(calculateNewOrder({ order: 2 }, { order: 6 })).toBe(4);
    });

    it('returns the next order divided by two when inserting at the start', () => {
      expect(calculateNewOrder(missingValue, { order: 8 })).toBe(4);
    });

    it('returns the previous order plus one when inserting at the end', () => {
      expect(calculateNewOrder({ order: 8 }, missingValue)).toBe(9);
    });

    it('falls back to 1 when there are no neighbors', () => {
      expect(calculateNewOrder(missingValue, missingValue)).toBe(1);
    });
  });

  describe('getMaxOrder', () => {
    it('returns zero for an empty list', () => {
      expect(getMaxOrder([])).toBe(0);
    });

    it('returns the highest order value', () => {
      expect(getMaxOrder([{ order: 4 }, { order: 11 }, { order: 7 }])).toBe(11);
    });
  });

  describe('formatTaskDate', () => {
    it('returns an empty string for missing values', () => {
      expect(formatTaskDate(missingValue)).toBe('');
      expect(formatTaskDate('')).toBe('');
    });

    it('formats dates using the expected task date format', () => {
      expect(formatTaskDate(new Date(2026, 3, 4, 12, 0, 0))).toBe('Apr 4');
    });
  });

  describe('getNextStatus', () => {
    it('cycles task status in order', () => {
      expect(getNextStatus('todo')).toBe('doing');
      expect(getNextStatus('doing')).toBe('done');
      expect(getNextStatus('done')).toBe('todo');
    });
  });
});
