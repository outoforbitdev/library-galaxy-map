import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { IEntityRef, ISpacelane, ISystem } from "./types";
import { useMapData } from "./useMapData";
import { type IUseSelectionOptions, useSelection } from "./useSelection";

const systems: ISystem<{ fleets: number }>[] = [
  {
    id: "a",
    name: "A",
    position: { x: 0, y: 0 },
    color: "red",
    data: { fleets: 3 },
  },
  { id: "b", name: "B", position: { x: 10, y: 0 }, color: "red" },
];
const lanes: ISpacelane[] = [
  {
    id: "l",
    name: "L",
    segments: [
      {
        id: "l0",
        origin: { x: 0, y: 0 },
        destination: { x: 10, y: 0 },
        color: "blue",
      },
      {
        id: "l1",
        origin: { x: 10, y: 0 },
        destination: { x: 10, y: 10 },
        color: "blue",
      },
    ],
  },
];

type Props = {
  systems: ISystem<{ fleets: number }>[];
  options: Omit<IUseSelectionOptions<{ fleets: number }, unknown>, "data">;
};

function setup(options: Props["options"] = {}) {
  return renderHook(
    ({ systems: s, options: o }: Props) =>
      useSelection({ ...o, data: useMapData(s, lanes) }),
    { initialProps: { systems, options } },
  );
}

describe("useSelection", () => {
  it("clears a selection whose id is not in the data, including before data loads", () => {
    const onSelect = vi.fn();
    const { result } = renderHook(
      ({ list }: { list: ISystem<{ fleets: number }>[] }) =>
        useSelection({
          data: useMapData(list, lanes),
          defaultSelected: { kind: "system", id: "a" },
          onSelect,
        }),
      { initialProps: { list: [] as ISystem<{ fleets: number }>[] } },
    );
    expect(result.current.selected).toBeNull();
    expect(onSelect).toHaveBeenCalledWith(null);
  });

  it("selects in uncontrolled mode and emits a typed event", () => {
    const onSelect = vi.fn();
    const { result } = setup({ onSelect });
    act(() => result.current.select({ kind: "system", id: "a" }));
    expect(result.current.selected).toEqual({ kind: "system", id: "a" });
    expect(onSelect).toHaveBeenCalledWith({
      kind: "system",
      id: "a",
      system: systems[0],
    });
    act(() => result.current.select(null));
    expect(result.current.selected).toBeNull();
    expect(onSelect).toHaveBeenLastCalledWith(null);
  });

  it("follows the prop in controlled mode", () => {
    const onSelect = vi.fn();
    const selected: IEntityRef = { kind: "system", id: "b" };
    const { result } = setup({ selected, onSelect });
    act(() => result.current.select({ kind: "system", id: "a" }));
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: "a" }));
    expect(result.current.selected).toEqual(selected);
  });

  it("ignores ids that are not in the data", () => {
    const onSelect = vi.fn();
    const { result } = setup({ onSelect });
    act(() => result.current.select({ kind: "system", id: "missing" }));
    expect(onSelect).not.toHaveBeenCalled();
    expect(result.current.selected).toBeNull();
  });

  it("reports the lane segment nearest the click", () => {
    const onSelect = vi.fn();
    const { result } = setup({ onSelect });
    act(() =>
      result.current.select({ kind: "lane", id: "l" }, { x: 11, y: 8 }),
    );
    expect(onSelect).toHaveBeenCalledWith({
      kind: "lane",
      id: "l",
      lane: lanes[0],
      segmentId: "l1",
    });
  });

  it("emits hover changes only when the hovered entity changes", () => {
    const onHover = vi.fn();
    const { result } = setup({ onHover });
    act(() => result.current.hover({ kind: "system", id: "a" }));
    act(() => result.current.hover({ kind: "system", id: "a" }));
    act(() => result.current.hover(null));
    expect(onHover.mock.calls).toEqual([
      [{ kind: "system", id: "a", system: systems[0] }],
      [null],
    ]);
  });

  it("clears the selection and hover when their entity leaves the data", () => {
    const onSelect = vi.fn();
    const onHover = vi.fn();
    const { result, rerender } = setup({
      onSelect,
      onHover,
      defaultSelected: { kind: "system", id: "a" },
    });
    act(() => result.current.hover({ kind: "system", id: "a" }));
    rerender({
      systems: [systems[1]],
      options: {
        onSelect,
        onHover,
        defaultSelected: { kind: "system", id: "a" },
      },
    });
    expect(result.current.selected).toBeNull();
    expect(result.current.hovered).toBeNull();
    expect(onSelect).toHaveBeenLastCalledWith(null);
    expect(onHover).toHaveBeenLastCalledWith(null);
  });

  it("keeps the selection when its entity is still in the data", () => {
    const onSelect = vi.fn();
    const options = {
      onSelect,
      defaultSelected: { kind: "system", id: "b" } as IEntityRef,
    };
    const { result, rerender } = setup(options);
    rerender({ systems: [systems[1]], options });
    expect(result.current.selected).toEqual({ kind: "system", id: "b" });
    expect(onSelect).not.toHaveBeenCalled();
  });
});
