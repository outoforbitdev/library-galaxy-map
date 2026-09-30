import type { Meta, StoryObj } from "@storybook/react-vite";
import { useMemo, useRef, useState } from "react";
import { generateGalaxy } from "../stories/generateGalaxy";
import { GalaxyMap, type IGalaxyMapHandle } from "./GalaxyMap";
import type { IEntityRef, ISpacelane, ISystem, IViewport } from "./types";

const small: ISystem[] = [
  { id: "core", name: "Core", position: { x: 0, y: 0 }, color: "#f5d90a" },
  {
    id: "north",
    name: "Northreach",
    position: { x: 0, y: 300 },
    color: "#3e8ed0",
  },
  {
    id: "east",
    name: "Eastmarch",
    position: { x: 300, y: 0 },
    color: "#e5484d",
  },
  {
    id: "south",
    name: "Southhold",
    position: { x: 0, y: -300 },
    color: "#46a758",
  },
];
const smallLanes: ISpacelane[] = [
  {
    id: "spine",
    name: "Spine",
    segments: [
      {
        id: "spine-0",
        origin: { x: 0, y: -300 },
        destination: { x: 0, y: 0 },
        color: "#46a758",
      },
      {
        id: "spine-1",
        origin: { x: 0, y: 0 },
        destination: { x: 0, y: 300 },
        color: "#3e8ed0",
      },
    ],
  },
];

// The ood-primary class supplies the theme background and text colors.
const frame = { width: "100%", height: "80vh" };

const meta: Meta<typeof GalaxyMap> = {
  title: "GalaxyMap",
  component: GalaxyMap,
};
export default meta;
type Story = StoryObj<typeof GalaxyMap>;

export const Basic: Story = {
  render: () => (
    <div className="ood-primary" style={frame}>
      <GalaxyMap systems={small} spacelanes={smallLanes} />
    </div>
  ),
};

/** 6,000 systems and 500 lanes of 40 segments: use for performance checks. */
export const FullScale: Story = {
  render: function FullScaleStory() {
    const { systems, lanes } = useMemo(() => generateGalaxy(6000, 500, 40), []);
    return (
      <div className="ood-primary" style={frame}>
        <GalaxyMap systems={systems} spacelanes={lanes} />
      </div>
    );
  },
};

/** A consumer-built route, drawn first so it sits on top, and framed with fitPoints. */
export const Route: Story = {
  render: function RouteStory() {
    const ref = useRef<IGalaxyMapHandle>(null);
    const [showRoute, setShowRoute] = useState(false);
    const route: ISpacelane = {
      id: "route",
      name: "Route",
      className: "story-route",
      segments: [
        {
          id: "r0",
          origin: { x: 300, y: 0 },
          destination: { x: 0, y: 0 },
          color: "#ffffff",
        },
        {
          id: "r1",
          origin: { x: 0, y: 0 },
          destination: { x: 0, y: 300 },
          color: "#ffffff",
        },
      ],
    };
    const toggle = () => {
      setShowRoute(!showRoute);
      if (!showRoute) {
        ref.current?.fitPoints(
          route.segments.flatMap((s) => [s.origin, s.destination]),
          { padding: 60, duration: 500 },
        );
      }
    };
    return (
      <div className="ood-primary" style={frame}>
        <style>
          {".story-route { stroke-width: 4px; stroke-dasharray: 8 4; }"}
        </style>
        <button onClick={toggle}>
          {showRoute ? "Clear route" : "Show route"}
        </button>
        <GalaxyMap
          ref={ref}
          systems={small}
          spacelanes={showRoute ? [route, ...smallLanes] : smallLanes}
        />
      </div>
    );
  },
};

/** Controlled selection and viewport, as an atlas would sync them to the URL. */
export const Controlled: Story = {
  render: function ControlledStory() {
    const [selected, setSelected] = useState<IEntityRef | null>(null);
    const [viewport, setViewport] = useState<IViewport>({
      center: { x: 0, y: 0 },
      zoom: 1,
    });
    const [settled, setSettled] = useState(viewport);
    return (
      <div className="ood-primary" style={frame}>
        <pre>{JSON.stringify({ selected, settled })}</pre>
        <GalaxyMap
          systems={small}
          spacelanes={smallLanes}
          selected={selected}
          onSelect={(event) =>
            setSelected(event && { kind: event.kind, id: event.id })
          }
          viewport={viewport}
          onViewportChange={(next, { settled: isSettled }) => {
            setViewport(next);
            if (isSettled) setSettled(next);
          }}
        />
      </div>
    );
  },
};
