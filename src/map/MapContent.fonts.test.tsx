import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mockElementSize } from "../testUtils";
import { GalaxyMap } from "./GalaxyMap";
import type { ISystem } from "./types";

const systems: ISystem[] = [
  { id: "a", name: "Alpha", position: { x: 0, y: 0 }, color: "red" },
];

beforeEach(() => {
  mockElementSize(800, 600);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("label measuring", () => {
  it("measures again when web fonts finish loading", () => {
    let fontsLoaded: () => void = () => {};
    const fonts = {
      addEventListener: vi.fn((_: string, listener: () => void) => {
        fontsLoaded = listener;
      }),
      removeEventListener: vi.fn(),
    };
    vi.stubGlobal("document", Object.assign(document, { fonts }));
    const realComputedStyle = window.getComputedStyle.bind(window);
    vi.spyOn(window, "getComputedStyle").mockImplementation((element) => {
      const style = realComputedStyle(element);
      return new Proxy(style, {
        get: (target, key) =>
          key === "font" ? "12px sans-serif" : Reflect.get(target, key),
      });
    });
    const getContext = vi
      .spyOn(HTMLCanvasElement.prototype, "getContext")
      .mockReturnValue({
        font: "",
        measureText: () => ({ width: 10 }),
      } as unknown as CanvasRenderingContext2D);

    render(<GalaxyMap systems={systems} spacelanes={[]} />);
    const before = getContext.mock.calls.length;
    act(() => fontsLoaded());
    expect(getContext.mock.calls.length).toBeGreaterThan(before);
  });
});
