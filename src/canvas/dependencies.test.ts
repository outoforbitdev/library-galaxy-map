import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, it } from "vitest";

const canvasDir = join(process.cwd(), "src", "canvas");

it("nothing in canvas/ imports from map/, so Canvas stays portable", () => {
  const offenders = readdirSync(canvasDir)
    .filter((file) => /\.(ts|tsx)$/.test(file))
    .filter((file) =>
      /from\s+["'][^"']*\/map(\/[^"']*)?["']/.test(
        readFileSync(join(canvasDir, file), "utf8"),
      ),
    );
  expect(offenders).toEqual([]);
});
