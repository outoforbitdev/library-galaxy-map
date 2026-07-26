import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useInitiallyExpanded } from "./useInitiallyExpanded";

function mockMatchMedia(matches: boolean) {
  vi.spyOn(window, "matchMedia").mockReturnValue({
    matches,
  } as MediaQueryList);
}

describe("useInitiallyExpanded", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns true when the large-screen media query matches at mount", () => {
    mockMatchMedia(true);

    const { result } = renderHook(() => useInitiallyExpanded());

    expect(result.current).toBe(true);
  });

  it("returns false when the large-screen media query does not match at mount", () => {
    mockMatchMedia(false);

    const { result } = renderHook(() => useInitiallyExpanded());

    expect(result.current).toBe(false);
  });

  it("does not change if the media query result changes after mount", () => {
    mockMatchMedia(true);
    const { result, rerender } = renderHook(() => useInitiallyExpanded());
    expect(result.current).toBe(true);

    mockMatchMedia(false);
    rerender();

    expect(result.current).toBe(true);
  });
});
