import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, fireEvent, act } from "@testing-library/react";
import { MapOptions } from "./MapOptions";
import { IRenderLimits } from "../../../types";
import { RENDER_LIMIT_DEBOUNCE_MS } from "../constants";

const defaultLimits: IRenderLimits = {
  planets: 50,
  planetLabels: 20,
  spacelanes: 30,
};

function expand(getByRole: (role: string) => HTMLElement) {
  fireEvent.click(getByRole("button"));
}

describe("MapOptions", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts collapsed and shows the title", () => {
    const { getByText, queryByLabelText } = render(
      <MapOptions
        currentLimits={defaultLimits}
        maxLimits={defaultLimits}
        setCurrentLimits={vi.fn()}
      />,
    );

    expect(getByText("Map Options")).toBeInTheDocument();
    expect(queryByLabelText("Planets")).not.toBeInTheDocument();
  });

  it("expands to show inputs initialized from currentLimits when toggled", () => {
    const { getByLabelText, getByRole } = render(
      <MapOptions
        currentLimits={defaultLimits}
        maxLimits={defaultLimits}
        setCurrentLimits={vi.fn()}
      />,
    );

    expand(getByRole);

    expect(getByLabelText("Planets")).toHaveValue(50);
    expect(getByLabelText("Planet Labels")).toHaveValue(20);
    expect(getByLabelText("Spacelanes")).toHaveValue(30);
  });

  it("does not call setCurrentLimits until the debounce settles", () => {
    const setCurrentLimits = vi.fn();
    const { getByLabelText, getByRole } = render(
      <MapOptions
        currentLimits={defaultLimits}
        maxLimits={defaultLimits}
        setCurrentLimits={setCurrentLimits}
      />,
    );
    expand(getByRole);

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
    const { getByLabelText, getByRole } = render(
      <MapOptions
        currentLimits={defaultLimits}
        maxLimits={defaultLimits}
        setCurrentLimits={setCurrentLimits}
      />,
    );
    expand(getByRole);

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
    const { getByLabelText, getByRole } = render(
      <MapOptions
        currentLimits={defaultLimits}
        maxLimits={defaultLimits}
        setCurrentLimits={setCurrentLimits}
      />,
    );
    expand(getByRole);

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
    const { getByTestId, getByRole } = render(
      <MapOptions
        currentLimits={{ ...defaultLimits, planets: 100 }}
        maxLimits={defaultLimits}
        setCurrentLimits={vi.fn()}
      />,
    );
    expand(getByRole);

    expect(getByTestId("warning-planets")).toBeInTheDocument();
  });

  it("does not show a warning indicator when at or below the consumer default", () => {
    const { queryByTestId, getByRole } = render(
      <MapOptions
        currentLimits={defaultLimits}
        maxLimits={defaultLimits}
        setCurrentLimits={vi.fn()}
      />,
    );
    expand(getByRole);

    expect(queryByTestId("warning-planets")).not.toBeInTheDocument();
  });

  it("renders customOptions content once expanded", () => {
    const { getByText, getByRole } = render(
      <MapOptions
        currentLimits={defaultLimits}
        maxLimits={defaultLimits}
        setCurrentLimits={vi.fn()}
        customOptions={<div>Extra Control</div>}
      />,
    );
    expand(getByRole);

    expect(getByText("Extra Control")).toBeInTheDocument();
  });

  it("toggles expansion when the toggle control is clicked", () => {
    const { getByRole, queryByLabelText } = render(
      <MapOptions
        currentLimits={defaultLimits}
        maxLimits={defaultLimits}
        setCurrentLimits={vi.fn()}
      />,
    );

    expect(queryByLabelText("Planets")).not.toBeInTheDocument();

    fireEvent.click(getByRole("button"));
    expect(queryByLabelText("Planets")).toBeInTheDocument();

    fireEvent.click(getByRole("button"));
    expect(queryByLabelText("Planets")).not.toBeInTheDocument();
  });
});
