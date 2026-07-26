import { describe, it, expect } from "vitest";
import { orderForRendering } from "./orderForRendering";

interface IItem {
  id: string;
}

describe("orderForRendering", () => {
  it("reverses the input list when there is no selected item", () => {
    const items: IItem[] = [{ id: "a" }, { id: "b" }, { id: "c" }];

    expect(orderForRendering(items)).toEqual([
      { id: "c" },
      { id: "b" },
      { id: "a" },
    ]);
  });

  it.each([["a"], ["b"], ["c"]])(
    "moves the selected item %s to the end regardless of its input position",
    (selectedId) => {
      const items: IItem[] = [{ id: "a" }, { id: "b" }, { id: "c" }];

      const result = orderForRendering(items, selectedId);

      expect(result[result.length - 1].id).toBe(selectedId);
      expect(result).toHaveLength(3);
    },
  );

  it("returns a single-item list unchanged", () => {
    const items: IItem[] = [{ id: "a" }];

    expect(orderForRendering(items)).toEqual([{ id: "a" }]);
  });

  it("returns an empty list for empty input", () => {
    expect(orderForRendering([])).toEqual([]);
  });

  it("ignores a selectedId that is not present in the list", () => {
    const items: IItem[] = [{ id: "a" }, { id: "b" }];

    expect(orderForRendering(items, "missing")).toEqual([
      { id: "b" },
      { id: "a" },
    ]);
  });
});
