/**
 * The system to focus after a bracket key. `visible` is in priority order,
 * highest first. Focus wraps at both ends.
 */
export function nextFocus(
  visible: readonly string[],
  current: string | null,
  direction: 1 | -1,
): string | null {
  if (visible.length === 0) return null;
  const index = current === null ? -1 : visible.indexOf(current);
  if (index < 0)
    return direction === 1 ? visible[0] : visible[visible.length - 1];
  return visible[(index + direction + visible.length) % visible.length];
}
