import { afterEach, describe, expect, it, vi } from "vitest";
import { createTextMeasurer } from "./measure";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("createTextMeasurer", () => {
  it("estimates widths from character count when canvas is unavailable", () => {
    expect(createTextMeasurer("12px sans-serif")("Alpha")).toBe(35);
    expect(createTextMeasurer()("Alpha")).toBe(35);
  });

  it("measures once per text with a canvas context", () => {
    const measureText = vi.fn((text: string) => ({ width: text.length * 5 }));
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      font: "",
      measureText,
    } as unknown as CanvasRenderingContext2D);
    const measure = createTextMeasurer("12px sans-serif");
    expect(measure("Alpha")).toBe(25);
    expect(measure("Alpha")).toBe(25);
    expect(measureText).toHaveBeenCalledTimes(1);
  });
});
