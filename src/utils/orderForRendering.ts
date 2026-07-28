export function orderForRendering<T extends { id: string }>(
  items: T[],
  selectedId?: string,
): T[] {
  const reversed = [...items].reverse();
  if (!selectedId) return reversed;
  const idx = reversed.findIndex((item) => item.id === selectedId);
  if (idx === -1) return reversed;
  return [...reversed.slice(0, idx), ...reversed.slice(idx + 1), reversed[idx]];
}
