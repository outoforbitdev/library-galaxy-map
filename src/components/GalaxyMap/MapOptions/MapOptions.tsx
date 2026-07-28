import { ReactNode, useEffect, useState } from "react";
import { Expandable } from "@outoforbitdev/ood-react";
import { IRenderLimits } from "../../../types";
import { RENDER_LIMIT_DEBOUNCE_MS } from "../constants";
import styles from "./MapOptions.module.css";

export interface IMapOptionsProps {
  currentLimits: IRenderLimits;
  maxLimits: IRenderLimits;
  setCurrentLimits: (limits: IRenderLimits) => void;
  customOptions?: ReactNode;
}

type LimitField = keyof IRenderLimits;

const FIELDS: { field: LimitField; label: string }[] = [
  { field: "planets", label: "Planets" },
  { field: "planetLabels", label: "Planet Labels" },
  { field: "spacelanes", label: "Spacelanes" },
];

// TODO: ood-react's Expandable always starts collapsed and has no way to
// seed an initial expanded value. Once it gains that capability (e.g. a
// defaultExpanded prop), use it to restore the responsive
// expanded-on-large-screens default described in the TDD (§ Panel
// initial collapse state is responsive) instead of always starting
// collapsed. See decisions.md.
export function MapOptions(props: IMapOptionsProps) {
  const [draft, setDraft] = useState<IRenderLimits>(props.currentLimits);

  useEffect(() => {
    const id = setTimeout(() => {
      props.setCurrentLimits(draft);
    }, RENDER_LIMIT_DEBOUNCE_MS);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  function ceilingFor(field: LimitField): number {
    if (field === "planetLabels") {
      return props.currentLimits.planets;
    }
    return Math.max(props.currentLimits[field], props.maxLimits[field]) * 2;
  }

  return (
    <Expandable
      title="Map Options"
      titleAlwaysVisible
      className={`${styles.options} ood-accent-block`}
    >
      {FIELDS.map(({ field, label }) => (
        <div key={field} className={styles.field}>
          <label htmlFor={`map-options-${field}`}>{label}</label>
          <input
            id={`map-options-${field}`}
            type="number"
            min={0}
            max={ceilingFor(field)}
            value={draft[field]}
            onChange={(e) =>
              setDraft({ ...draft, [field]: Number(e.target.value) })
            }
          />
          {props.currentLimits[field] > props.maxLimits[field] && (
            <span data-testid={`warning-${field}`} className={styles.warning}>
              ⚠
            </span>
          )}
        </div>
      ))}
      {props.customOptions}
    </Expandable>
  );
}
