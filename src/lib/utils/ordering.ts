export function calculateNewOrder(
  previousItem: { order: number } | undefined,
  nextItem: { order: number } | undefined,
): number {
  if (previousItem && nextItem) {
    return (previousItem.order + nextItem.order) / 2;
  }
  if (previousItem) {
    return previousItem.order + 1;
  }
  if (nextItem) {
    return nextItem.order / 2;
  }
  return 1;
}

export function getMaxOrder(tasks: { order: number }[]): number {
  if (tasks.length === 0) return 0;
  return Math.max(...tasks.map(t => t.order));
}
