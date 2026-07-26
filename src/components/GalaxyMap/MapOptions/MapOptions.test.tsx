import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, fireEvent, act } from "@testing-library/react";
import { MapOptions } from "./MapOptions";
import { IRenderLimits } from "../../../types";
import { RENDER_LIMIT_DEBOUNCE_MS } from "../constants";

function mockMatchMedia(matches: boolean) {
  vi.spyOn(window, "matchMedia").mockReturnValue({
    matches,
  } as MediaQueryList);
}

const defaultLimits: IRenderLimits = {
  planets: 50,
  planetLabels: 20,
  spacelanes: 30,
};

describe("MapOptions", () => {
  beforeEach(() => {
    mockMatchMedia(true);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("renders inputs initialized from currentLimits", () => {
    const { getByLabelText } = render(
      <MapOptions
        currentLimits={defaultLimits}
        maxLimits={defaultLimits}
        setCurrentLimits={vi.fn()}
      />,
    );

    expect(getByLabelText("Planets")).toHaveValue(50);
    expect(getByLabelText("Planet Labels")).toHaveValue(20);
    expect(getByLabelText("Spacelanes")).toHaveValue(30);
  });

  it("does not call setCurrentLimits until the debounce settles", () => {
    const setCurrentLimits = vi.fn();
    const { getByLabelText } = render(
      <MapOptions
        currentLimits={defaultLimits}
        maxLimits={defaultLimits}
        setCurrentLimits={setCurrentLimits}
      />,
    );

    fireEvent.change(getByLabelText("Planets"), { target: { value: "75" } });
    expect(getByLabelText("Planets")).toHaveValue(75);
    expect(setCurrentLimits).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(RENDER_LIMIT_DEBOUNCE_MS);
    });

    expect(setCurrentLimits).toHaveBeenCalledWith({
      ...defaultLimits,
      planets: 75,
    });
  });

  it("only propagates the final value when changed multiple times within the debounce window", () => {
    const setCurrentLimits = vi.fn();
    const { getByLabelText } = render(
      <MapOptions
        currentLimits={defaultLimits}
        maxLimits={defaultLimits}
        setCurrentLimits={setCurrentLimits}
      />,
    );

    fireEvent.change(getByLabelText("Planets"), { target: { value: "60" } });
    act(() => {
      vi.advanceTimersByTime(RENDER_LIMIT_DEBOUNCE_MS - 50);
    });
    fireEvent.change(getByLabelText("Planets"), { target: { value: "70" } });
    act(() => {
      vi.advanceTimersByTime(RENDER_LIMIT_DEBOUNCE_MS);
    });

    expect(setCurrentLimits).toHaveBeenCalledTimes(1);
    expect(setCurrentLimits).toHaveBeenCalledWith({
      ...defaultLimits,
      planets: 70,
    });
  });

  it("allows setting a limit below the default", () => {
    const setCurrentLimits = vi.fn();
    const { getByLabelText } = render(
      <MapOptions
        currentLimits={defaultLimits}
        maxLimits={defaultLimits}
        setCurrentLimits={setCurrentLimits}
      />,
    );

    fireEvent.change(getByLabelText("Spacelanes"), { target: { value: "0" } });
    act(() => {
      vi.advanceTimersByTime(RENDER_LIMIT_DEBOUNCE_MS);
    });

    expect(setCurrentLimits).toHaveBeenCalledWith({
      ...defaultLimits,
      spacelanes: 0,
    });
  });

  it("shows a warning indicator when a limit exceeds the consumer default", () => {
    const { getByTestId } = render(
      <MapOptions
        currentLimits={{ ...defaultLimits, planets: 100 }}
        maxLimits={defaultLimits}
        setCurrentLimits={vi.fn()}
      />,
    );

    expect(getByTestId("warning-planets")).toBeInTheDocument();
  });

  it("does not show a warning indicator when at or below the consumer default", () => {
    const { queryByTestId } = render(
      <MapOptions
        currentLimits={defaultLimits}
        maxLimits={defaultLimits}
        setCurrentLimits={vi.fn()}
      />,
    );

    expect(queryByTestId("warning-planets")).not.toBeInTheDocument();
  });

  it("renders customOptions content", () => {
    const { getByText } = render(
      <MapOptions
        currentLimits={defaultLimits}
        maxLimits={defaultLimits}
        setCurrentLimits={vi.fn()}
        customOptions={<div>Extra Control</div>}
      />,
    );

    expect(getByText("Extra Control")).toBeInTheDocument();
  });

  it("starts collapsed on a small screen and expands when toggled", () => {
    mockMatchMedia(false);
    const { getByRole, queryByLabelText } = render(
      <MapOptions
        currentLimits={defaultLimits}
        maxLimits={defaultLimits}
        setCurrentLimits={vi.fn()}
      />,
    );

    expect(queryByLabelText("Planets")).not.toBeInTheDocument();

    fireEvent.click(getByRole("button", { name: "Map Options" }));

    expect(queryByLabelText("Planets")).toBeInTheDocument();
  });
});
