import { RefObject, useState } from "react";
import PlanetMap, { IPlanet } from "./PlanetMap";
import SpacelaneMap, { ISpacelane } from "./SpacelaneMap";
import { Draggable, lib } from "@outoforbitdev/ood-react";
import Zoomable from "./Zoomable";
import styles from "../styles/items.module.css";
import { MapItemVisibility } from "./MapItemVisibilitySelect";

export interface IZoomableMapProps {
  planets: IPlanet[];
  spacelanes: ISpacelane[];
  containerRef: RefObject<HTMLDivElement | null>;
  dimensions: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  };
  mapOptions: IMapOptions;
  zoom: {
    initial?: number;
    min?: number;
    max?: number;
  };
  onPlanetSelect?: (planet: IPlanet) => void;
  onSpacelaneSelect?: (spacelane: ISpacelane) => void;
  selectedPlanetId?: string;
}

interface IMapOptions {
  planetLabelsVisibility: MapItemVisibility;
  planetsVisibility: MapItemVisibility;
  spacelanesVisiblity: MapItemVisibility;
}

export default function ZoomableMap(props: IZoomableMapProps) {
  const centerX = props.dimensions.minX * -1;
  const centerY = props.dimensions.maxY;
  const zoomModifier = 0.1;
  const [zoomClassName, setZoomClassName] = useState(
    zoomLevelToClassNames(props.zoom.initial || 1, zoomModifier),
  );
  const [isDragging, setIsDragging] = useState(false);
  const [wasDragging, setWasDragging] = useState(false);

  if (isDragging && !wasDragging) setWasDragging(true);

  const onZoomChange = (zoomLevel: number) => {
    setZoomClassName(zoomLevelToClassNames(zoomLevel, zoomModifier));
  };

  const zoomProps = {
    modifier: zoomModifier,
    ...props.zoom,
  };

  let selectedPlanet = null;
  let selectedSpacelane = null;

  const onPlanetSelect = (planet: IPlanet) => {
    if (wasDragging) {
      setWasDragging(false);
      return;
    }
    props.onPlanetSelect?.(planet);
  };

  return (
    <Draggable initialPosition={{ x: 0, y: 0 }} setIsDragging={setIsDragging}>
      <Zoomable
        dimensions={props.dimensions}
        zoom={zoomProps}
        containerRef={props.containerRef}
        onZoomChange={onZoomChange}
        {...lib.getDomProps(
          {},
          zoomClassName,
          getMapLabelVisibilityStyle(
            "planet_label",
            props.mapOptions.planetLabelsVisibility,
            props.mapOptions.planetsVisibility,
          ),
          getMapItemVisilibityStyle(
            "planet",
            props.mapOptions.planetsVisibility,
          ),
          getMapItemVisilibityStyle(
            "spacelane",
            props.mapOptions.spacelanesVisiblity,
          ),
        )}
      >
        {props.spacelanes.map((s: ISpacelane, _i: number) => (
          <SpacelaneMap
            spacelane={s}
            centerX={centerX}
            centerY={centerY}
            key={_i}
            zoomLevel={1}
            onClick={props.onSpacelaneSelect}
          />
        ))}
        {props.planets.map((p: IPlanet, i: number) => {
          if (props.selectedPlanetId !== p.id) {
            return (
              <PlanetMap
                planet={p}
                centerX={centerX}
                centerY={centerY}
                key={i}
                zoomLevel={1}
                onClick={onPlanetSelect}
                selected={false}
              />
            );
          }
          selectedPlanet = p;
          return null;
        })}
        {selectedPlanet ? (
          <PlanetMap
            planet={selectedPlanet}
            centerX={centerX}
            centerY={centerY}
            zoomLevel={1}
            onClick={onPlanetSelect}
            selected={true}
          />
        ) : null}
      </Zoomable>
    </Draggable>
  );
}

function zoomLevelToClassNames(
  zoomLevel: number,
  zoomModifier: number,
): string {
  return (
    getZoomStyle(zoomLevel) + " " + getHiddenStyles(zoomLevel * zoomModifier)
  );
}

function getZoomStyle(zoomLevel: number) {
  let zoomClassName = styles.zoom_1000;
  if (zoomLevel < 0.01) {
    zoomClassName = styles.zoom_01;
  } else if (zoomLevel < 0.02) {
    zoomClassName = styles.zoom_02;
  } else if (zoomLevel < 0.04) {
    zoomClassName = styles.zoom_04;
  } else if (zoomLevel < 0.05) {
    zoomClassName = styles.zoom_05;
  } else if (zoomLevel < 0.1) {
    zoomClassName = styles.zoom_10;
  } else if (zoomLevel < 0.2) {
    zoomClassName = styles.zoom_20;
  } else if (zoomLevel < 0.25) {
    zoomClassName = styles.zoom_25;
  } else if (zoomLevel < 0.5) {
    zoomClassName = styles.zoom_50;
  } else if (zoomLevel < 0.75) {
    zoomClassName = styles.zoom_75;
  } else if (zoomLevel < 1) {
    zoomClassName = styles.zoom_100;
  } else if (zoomLevel < 2) {
    zoomClassName = styles.zoom_200;
  } else if (zoomLevel < 4) {
    zoomClassName = styles.zoom_400;
  } else if (zoomLevel < 5) {
    zoomClassName = styles.zoom_500;
  } else if (zoomLevel < 10) {
    zoomClassName = styles.zoom_1000;
  }
  return zoomClassName;
}

function getHiddenStyles(zoomLevel: number): string {
  let hiddenStyles = "";
  if (zoomLevel < 0.5) {
    hiddenStyles += " " + styles.hide_quaternary_label;
  }
  if (zoomLevel < 0.2) {
    hiddenStyles +=
      " " + styles.hide_tertiary_label + " " + styles.hide_quaternary;
  }
  if (zoomLevel < 0.05) {
    hiddenStyles +=
      " " + styles.hide_secondary_label + " " + styles.hide_tertiary;
  }
  if (zoomLevel < 0.025) {
    hiddenStyles += " " + styles.hide_secondary;
  }

  return hiddenStyles;
}

function getMapItemVisilibityStyle(
  itemType: "planet" | "spacelane",
  visibility: MapItemVisibility,
): string {
  switch (visibility) {
    case "show":
      return itemType === "planet"
        ? styles.show_planets
        : styles.show_spacelanes;
    case "hide":
      return itemType === "planet"
        ? styles.hide_planets
        : styles.hide_spacelanes;
    case "dynamic":
    default:
      return "";
  }
}

function getMapLabelVisibilityStyle(
  itemType: "planet_label" | "spacelane_label",
  visibility: MapItemVisibility,
  itemVisibility: MapItemVisibility,
): string {
  switch (visibility) {
    case "show":
      return styles.show_planet_labels;
    case "hide":
      return styles.hide_planet_labels;
    case "dynamic":
    default:
      return "";
  }
}
