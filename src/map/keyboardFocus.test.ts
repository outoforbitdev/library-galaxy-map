import { describe, expect, it } from "vitest";
import { nextFocus } from "./keyboardFocus";

describe("nextFocus", () => {
  const visible = ["a", "b", "c"];

  it("starts at the highest priority going forward and the lowest going back", () => {
    expect(nextFocus(visible, null, 1)).toBe("a");
    expect(nextFocus(visible, null, -1)).toBe("c");
  });

  it("moves and wraps", () => {
    expect(nextFocus(visible, "a", 1)).toBe("b");
    expect(nextFocus(visible, "c", 1)).toBe("a");
    expect(nextFocus(visible, "a", -1)).toBe("c");
  });

  it("restarts when the current system is not visible", () => {
    expect(nextFocus(visible, "gone", 1)).toBe("a");
  });

  it("returns null with nothing visible", () => {
    expect(nextFocus([], "a", 1)).toBeNull();
  });
});
