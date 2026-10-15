import { fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mockElementSize } from "../testUtils";
import { GalaxyMap } from "./GalaxyMap";
import styles from "./GalaxyMap.module.css";
import type { ISystem } from "./types";

const systems: ISystem[] = [
  { id: "a", name: "Alpha", position: { x: -100, y: -50 }, color: "red" },
  { id: "b", name: "Beta", position: { x: 100, y: 50 }, color: "blue" },
];

function setup(props: Partial<Parameters<typeof GalaxyMap>[0]> = {}) {
  const onSelect = vi.fn();
  const onViewportChange = vi.fn();
  const utils = render(
    <GalaxyMap
      systems={systems}
      spacelanes={[]}
      onSelect={onSelect}
      onViewportChange={onViewportChange}
      {...props}
    />,
  );
  const root = utils.getByRole("application");
  const key = (k: string) => fireEvent.keyDown(root, { key: k });
  const active = () => {
    const id = root.getAttribute("aria-activedescendant");
    return id ? document.getElementById(id) : null;
  };
  return { ...utils, root, key, active, onSelect, onViewportChange };
}

beforeEach(() => {
  mockElementSize(800, 600);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("GalaxyMap keyboard", () => {
  it("moves focus through visible systems in priority order with the bracket keys", () => {
    const { key, active, root } = setup();
    expect(root).not.toHaveAttribute("aria-activedescendant");
    key("]");
    expect(active()).toHaveAttribute("data-id", "a");
    key("]");
    expect(active()).toHaveAttribute("data-id", "b");
    key("[");
    expect(active()).toHaveAttribute("data-id", "a");
  });

  it.each(["ctrlKey", "metaKey", "altKey"])(
    "leaves bracket keys with %s to the browser",
    (modifier) => {
      const { root, active } = setup();
      const proceed = fireEvent.keyDown(root, { key: "[", [modifier]: true });
      expect(proceed).toBe(true);
      expect(active()).toBeNull();
    },
  );

  it("draws a focus ring", () => {
    const { key, container } = setup();
    key("]");
    expect(container.querySelector(`.${styles.focusRing}`)).not.toBeNull();
  });

  it("selects with Enter or Space and clears with Escape", () => {
    const { key, onSelect } = setup();
    key("]");
    key("Enter");
    expect(onSelect).toHaveBeenLastCalledWith(
      expect.objectContaining({ id: "a" }),
    );
    key("]");
    key(" ");
    expect(onSelect).toHaveBeenLastCalledWith(
      expect.objectContaining({ id: "b" }),
    );
    key("Escape");
    expect(onSelect).toHaveBeenLastCalledWith(null);
  });

  it("leaves Escape to the page when nothing is selected", () => {
    const { root, key, onSelect } = setup();
    expect(fireEvent.keyDown(root, { key: "Escape" })).toBe(true);
    expect(onSelect).not.toHaveBeenCalled();
    key("]");
    key("Enter");
    expect(fireEvent.keyDown(root, { key: "Escape" })).toBe(false);
  });

  it("still pans with arrow keys", () => {
    const { key, onViewportChange } = setup();
    onViewportChange.mockClear();
    key("ArrowLeft");
    expect(onViewportChange).toHaveBeenCalled();
  });

  it("moves focus but does not select when selection is disabled", () => {
    const { key, active, onSelect } = setup({ selectionEnabled: false });
    key("]");
    key("Enter");
    expect(active()).toHaveAttribute("data-id", "a");
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("clears focus, selection, and hover together when the system leaves the data", () => {
    const onHover = vi.fn();
    const { key, root, rerender, container, onSelect, onViewportChange } =
      setup({
        onHover,
        defaultSelected: { kind: "system", id: "a" },
      });
    key("]");
    fireEvent.pointerOver(
      container.querySelector(`[data-id='a'] .${styles.glyph}`)!,
      { pointerType: "mouse" },
    );
    rerender(
      <GalaxyMap
        systems={[systems[1]]}
        spacelanes={[]}
        onSelect={onSelect}
        onHover={onHover}
        onViewportChange={onViewportChange}
        defaultSelected={{ kind: "system", id: "a" }}
      />,
    );
    expect(root).not.toHaveAttribute("aria-activedescendant");
    expect(onSelect).toHaveBeenLastCalledWith(null);
    expect(onHover).toHaveBeenLastCalledWith(null);
    expect(container.querySelector(`.${styles.highlight}`)).toBeNull();
  });
});
