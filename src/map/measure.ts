import { FALLBACK_CHAR_WIDTH_PX } from "./constants";

/** Returns a text's rendered width in pixels. */
export type MeasureText = (text: string) => number;

/**
 * Measures label widths with a canvas 2D context in the given CSS font,
 * caching each text. Without a font or a canvas (server rendering, tests), it
 * estimates FALLBACK_CHAR_WIDTH_PX per character, so results stay deterministic.
 */
export function createTextMeasurer(font?: string): MeasureText {
  let context: CanvasRenderingContext2D | null = null;
  if (font && typeof document !== "undefined") {
    context = document.createElement("canvas").getContext("2d");
    if (context) context.font = font;
  }
  const cache = new Map<string, number>();
  return (text: string) => {
    const cached = cache.get(text);
    if (cached !== undefined) return cached;
    const width = context
      ? context.measureText(text).width
      : text.length * FALLBACK_CHAR_WIDTH_PX;
    cache.set(text, width);
    return width;
  };
}
