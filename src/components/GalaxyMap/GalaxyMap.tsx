import {
  ReactNode,
  Ref,
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  useEffect,
} from "react";
import { IComponentProps, lib } from "@outoforbitdev/ood-react";
import {
  IGalaxyMapHandle,
  ILegendEntry,
  IMapCoordinate,
  IMapDimensions,
  IMapOptions,
  IPlanet,
  IRenderLimits,
  ISpacelane,
} from "../../types";
import { useZoomPan } from "./hooks/useZoomPan";
import { useLabelSet } from "./hooks/useLabelSet";
import { computeViewport } from "../../utils/coordinates";
import { selectRendered } from "../../utils/selectRendered";
import { ZoomableCanvas } from "./ZoomableCanvas/ZoomableCanvas";
import { MapOverlay } from "./MapOverlay/MapOverlay";
import styles from "./GalaxyMap.module.css";

export interface IGalaxyMapProps extends IComponentProps {
  planets: IPlanet[];
  spacelanes: ISpacelane[];
  dimensions: IMapDimensions;
  renderLimits: IRenderLimits;
  zoom?: { initial?: number; min?: number; max?: number };
  initialCenter?: IMapCoordinate;
  onPlanetSelect?: (planet: IPlanet) => void;
  onSpaceLaneSelect?: (spacelane: ISpacelane) => void;
  selectedPlanetId?: string;
  selectedSpaceLaneId?: string;
  onZoomChange?: (zoom: number) => void;
  onCenterChange?: (center: IMapCoordinate) => void;
  legendEntries?: ILegendEntry[];
  mapOptions?: IMapOptions;
  leftChildren?: ReactNode;
  rightChildren?: ReactNode;
}

function GalaxyMapInner(props: IGalaxyMapProps, ref: Ref<IGalaxyMapHandle>) {
  const { zoom, center, handlers, isDragging, animateTo } = useZoomPan({
    dimensions: props.dimensions,
    zoom: {
      initial: props.zoom?.initial ?? 1,
      min: props.zoom?.min,
      max: props.zoom?.max,
    },
    initialCenter: props.initialCenter,
    onZoomChange: props.onZoomChange,
    onCenterChange: props.onCenterChange,
  });

  const [currentLimits, setCurrentLimits] = useState<IRenderLimits>(
    props.renderLimits,
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const containerSizeRef = useRef({ width: 0, height: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      containerSizeRef.current = { width, height };
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const { width, height } = containerSizeRef.current;
  const viewport =
    width > 0 && height > 0
      ? computeViewport(center, zoom, width, height)
      : {
          minX: props.dimensions.min.x,
          minY: props.dimensions.min.y,
          maxX: props.dimensions.max.x,
          maxY: props.dimensions.max.y,
        };

  const { planets: renderedPlanets, spacelanes: renderedSpaceLanes } =
    selectRendered(props.planets, props.spacelanes, currentLimits, viewport);

  const labelSet = useLabelSet(
    renderedPlanets,
    currentLimits.planetLabels,
    zoom,
    props.selectedPlanetId,
  );

  useImperativeHandle(ref, () => ({
    zoomTo(target) {
      animateTo(target);
    },
  }));

  const domProps = lib.getDomProps(props, styles.container);

  return (
    <div {...domProps} ref={containerRef}>
      <ZoomableCanvas
        planets={renderedPlanets}
        spacelanes={renderedSpaceLanes}
        labelSet={labelSet}
        zoom={zoom}
        center={center}
        handlers={handlers}
        isDragging={isDragging}
        selectedPlanetId={props.selectedPlanetId}
        selectedSpaceLaneId={props.selectedSpaceLaneId}
        onPlanetSelect={props.onPlanetSelect}
        onSpaceLaneSelect={props.onSpaceLaneSelect}
      />
      <MapOverlay
        leftChildren={props.leftChildren}
        legendEntries={props.legendEntries}
        currentLimits={currentLimits}
        maxLimits={props.renderLimits}
        setCurrentLimits={setCurrentLimits}
        customOptions={props.mapOptions?.customOptions}
        rightChildren={props.rightChildren}
      >
        {props.children}
      </MapOverlay>
    </div>
  );
}

export const GalaxyMap = forwardRef(GalaxyMapInner);
