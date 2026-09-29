import { vi } from "vitest";

/**
 * Gives every HTML element a fixed size in tests. jsdom reports zero for all
 * layout, and the canvas needs a size before it renders content.
 */
export function mockElementSize(width: number, height: number) {
  return vi
    .spyOn(HTMLElement.prototype, "getBoundingClientRect")
    .mockReturnValue({
      width,
      height,
      top: 0,
      left: 0,
      right: width,
      bottom: height,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } as DOMRect);
}
