import { useState } from "react";

const LARGE_SCREEN_BREAKPOINT = "(min-width: 768px)";

export function useInitiallyExpanded(): boolean {
  return useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(LARGE_SCREEN_BREAKPOINT).matches;
  })[0];
}
