import ZoomableMap from "./ZoomableMap";
import { IMapOptionsProps, MapOptions } from "./MapOptions";
import { ReactNode, useRef, useState } from "react";
import { IPlanet } from "./PlanetMap";
import { ISpacelane } from "./SpacelaneMap";
import styles from "../styles/map.module.css";
import { MapItemVisibility } from "./MapItemVisibilitySelect";
import { lib, IChildlessComponentProps } from "@outoforbitdev/ood-react";

export interface IMapProps extends IChildlessComponentProps {
  planets: IPlanet[];
  spacelanes: ISpacelane[];
  dimensions: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  };
  mapOptions?: IMapOptions;
  zoom?: {
    initial?: number;
    min?: number;
    max?: number;
  };
}

export interface IMapOptions {
  planetLabelVisibility?: MapItemVisibility;
  planetVisibility?: MapItemVisibility;
  spacelaneVisibility?: MapItemVisibility;
  customOptions?: ReactNode;
}

export default function Map(props: IMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [planetLabelVisibility, setPlanetLabelVisibility] =
    useState<MapItemVisibility>(
      props.mapOptions?.planetLabelVisibility ?? "dynamic",
    );
  const [planetVisibility, setPlanetVisibility] = useState<MapItemVisibility>(
    props.mapOptions?.planetVisibility ?? "dynamic",
  );
  const [spacelaneVisibility, setSpacelaneVisibility] =
    useState<MapItemVisibility>(
      props.mapOptions?.spacelaneVisibility ?? "dynamic",
    );

  const mapOptionsProps: IMapOptionsProps = {
    planetLabelVisibility: planetLabelVisibility,
    setPlanetLabels: setPlanetLabelVisibility,
    planetVisibility: planetVisibility,
    setPlanetVisibility: setPlanetVisibility,
    spacelaneVisibility: spacelaneVisibility,
    setSpacelaneVisibility: setSpacelaneVisibility,
  };

  return (
    <div
      ref={containerRef}
      {...lib.getDomProps(props, styles.container)}
    >
      <MapOptions {...mapOptionsProps}>
        {props.mapOptions?.customOptions}
      </MapOptions>
      <ZoomableMap
        containerRef={containerRef}
        {...props}
        mapOptions={{
          planetLabelsVisibility: planetLabelVisibility,
          planetsVisibility: planetVisibility,
          spacelanesVisiblity: spacelaneVisibility,
        }}
        zoom={props.zoom ?? {}}
      />
    </div>
  );
}
