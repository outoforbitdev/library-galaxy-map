import { IMapOptionsProps } from "./MapOptions";
import { ReactNode, useRef, useState } from "react";
import { IPlanet } from "./MapPlanet";
import { ISpacelane } from "./MapSpacelane";
import styles from "../styles/map.module.css";
import { MapItemVisibility } from "./MapItemVisibilitySelect";
import { lib, IComponentProps } from "@outoforbitdev/ood-react";
import { MapUI } from "./MapUI";
import { LegendEntry } from "./MapLegend";
import MapSvg from "./MapSvg";

export interface IMapProps extends IComponentProps {
  planets: IPlanet[];
  spacelanes: ISpacelane[];
  dimensions: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  };
  mapOptions?: IMapOptions;
  legendEntries?: LegendEntry[];
  zoom?: {
    initial?: number;
    min?: number;
    max?: number;
  };
  onPlanetSelect?: (planetId: string) => void;
  onSpacelaneSelect?: (spacelane: ISpacelane) => void;
  selectedPlanetId?: string;
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
    <div ref={containerRef} {...lib.getDomProps(props, styles.container)}>
      <MapUI
        mapOptions={mapOptionsProps}
        customOptions={props.mapOptions?.customOptions}
        legendEntries={props.legendEntries}
      >
        {props.children}
      </MapUI>
      <MapSvg
        planets={props.planets}
        spacelanes={props.spacelanes}
        zoom={{
          initial: 0.25,
        }}
        center={{ x: 0, y: 0 }}
        onPlanetSelect={props.onPlanetSelect}
      />
    </div>
  );
}
