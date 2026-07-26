import { useState } from "react";

const LARGE_SCREEN_BREAKPOINT = "(min-width: 768px)";

export function useInitiallyExpanded(): boolean {
  return useState<boolean>(
    () => window.matchMedia(LARGE_SCREEN_BREAKPOINT).matches,
  )[0];
}
