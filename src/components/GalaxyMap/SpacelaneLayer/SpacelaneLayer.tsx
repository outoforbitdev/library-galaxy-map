import { RefObject } from "react";
import { ISpacelane } from "../../../types";
import { colorToCss } from "../../../utils/color";
import { orderForRendering } from "../../../utils/orderForRendering";

const VISUAL_STROKE_WIDTH = 1.5;
const SELECTED_STROKE_WIDTH = 3;
const HIT_AREA_STROKE_WIDTH = 8;

export interface ISpacelaneLayerProps {
  spacelanes: ISpacelane[];
  selectedSpaceLaneId?: string;
  onSpaceLaneSelect?: (spacelane: ISpacelane) => void;
  isDragging: RefObject<boolean>;
}

export function SpacelaneLayer(props: ISpacelaneLayerProps) {
  const ordered = orderForRendering(
    props.spacelanes,
    props.selectedSpaceLaneId,
  );

  return (
    <>
      {ordered.map((spacelane) => {
        const isSelected = props.selectedSpaceLaneId === spacelane.id;
        return (
          <g
            key={spacelane.id}
            data-testid={`spacelane-${spacelane.id}`}
            onClick={() => {
              if (!props.isDragging.current) {
                props.onSpaceLaneSelect?.(spacelane);
              }
            }}
          >
            {spacelane.segments.map((seg, i) => (
              <g key={i}>
                <line
                  x1={seg.origin.x}
                  y1={seg.origin.y}
                  x2={seg.destination.x}
                  y2={seg.destination.y}
                  stroke={colorToCss(seg.color)}
                  strokeWidth={
                    isSelected ? SELECTED_STROKE_WIDTH : VISUAL_STROKE_WIDTH
                  }
                  vectorEffect="non-scaling-stroke"
                />
                <line
                  x1={seg.origin.x}
                  y1={seg.origin.y}
                  x2={seg.destination.x}
                  y2={seg.destination.y}
                  stroke="transparent"
                  strokeWidth={HIT_AREA_STROKE_WIDTH}
                  vectorEffect="non-scaling-stroke"
                />
              </g>
            ))}
          </g>
        );
      })}
    </>
  );
}
