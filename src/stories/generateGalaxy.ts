import type { ISpacelane, ISystem } from "../map/types";

const PALETTE = [
  "#9aa0a6",
  "#e5484d",
  "#3e8ed0",
  "#46a758",
  "#f5d90a",
  "#d6409f",
  "#12a594",
  "#a18072",
];
const SYLLABLES = [
  "ka",
  "ri",
  "on",
  "tel",
  "mar",
  "zu",
  "ven",
  "sha",
  "dor",
  "ix",
  "lo",
  "que",
  "bra",
  "nis",
  "tor",
];

/** Deterministic pseudo-random numbers, so every story run shows the same galaxy. */
function random(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

/**
 * A two-arm spiral galaxy in a ±12,000 world, matching app-galaxy-map's
 * coordinate space. Used for full-scale performance checks (NFR-P1).
 */
export function generateGalaxy(
  systemCount: number,
  laneCount: number,
  segmentsPerLane: number,
) {
  const next = random(42);
  const systems: ISystem[] = [];
  while (systems.length < systemCount) {
    const arm = next() < 0.5 ? 0 : Math.PI;
    const radius = Math.sqrt(next()) * 11500;
    const theta = arm + radius / 2600 + (next() - 0.5) * 1.1;
    const x = Math.round(radius * Math.cos(theta) + (next() - 0.5) * 900);
    const y = Math.round(radius * Math.sin(theta) + (next() - 0.5) * 900);
    if (Math.abs(x) > 12000 || Math.abs(y) > 12000) continue;
    const syllables = 2 + Math.floor(next() * 3);
    let name = "";
    for (let i = 0; i < syllables; i++)
      name += SYLLABLES[Math.floor(next() * SYLLABLES.length)];
    const sector =
      Math.floor(
        ((Math.atan2(y, x) + Math.PI) / (2 * Math.PI)) * PALETTE.length,
      ) % PALETTE.length;
    systems.push({
      id: `s${systems.length}`,
      name: name[0].toUpperCase() + name.slice(1),
      position: { x, y },
      color: PALETTE[sector],
    });
  }
  const lanes: ISpacelane[] = [];
  for (let l = 0; l < laneCount; l++) {
    let current = systems[Math.floor(next() * systems.length)];
    let color = current.color;
    const segments: ISpacelane["segments"] = [];
    for (let s = 0; s < segmentsPerLane; s++) {
      const target = systems[Math.floor(next() * systems.length)];
      const destination = {
        x:
          current.position.x +
          Math.sign(target.position.x - current.position.x) *
            150 *
            (0.5 + next()),
        y:
          current.position.y +
          Math.sign(target.position.y - current.position.y) *
            150 *
            (0.5 + next()),
      };
      if (next() < 0.08) color = PALETTE[Math.floor(next() * PALETTE.length)];
      segments.push({
        id: `l${l}-${s}`,
        origin: current.position,
        destination,
        color,
      });
      current = { ...current, position: destination };
    }
    lanes.push({ id: `l${l}`, name: `Lane ${l}`, segments });
  }
  return { systems, lanes };
}
