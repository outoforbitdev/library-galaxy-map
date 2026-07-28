import type { Meta, StoryObj } from "@storybook/react";
import { ComponentProps } from "react";
import { GalaxyMap } from "./GalaxyMap";
import {
  ILegendEntry,
  IMapDimensions,
  IPlanet,
  IRenderLimits,
  ISpacelane,
  MapColor,
} from "../../types";

const dimensions: IMapDimensions = {
  min: { x: -500, y: -500 },
  max: { x: 500, y: 500 },
};

const defaultRenderLimits: IRenderLimits = {
  planets: 50,
  planetLabels: 20,
  spacelanes: 30,
};

function planet(id: string, x: number, y: number, color: MapColor): IPlanet {
  return { id, name: id, position: { x, y }, color };
}

function lane(
  id: string,
  points: [number, number][],
  color: MapColor,
): ISpacelane {
  return {
    id,
    segments: points.slice(0, -1).map((origin, i) => ({
      origin: { x: origin[0], y: origin[1] },
      destination: { x: points[i + 1][0], y: points[i + 1][1] },
      color,
    })),
  };
}

const representativePlanets: IPlanet[] = [
  planet("csilla", 0, 0, MapColor.Blue),
  planet("avidich", -120, 40, MapColor.Gray),
  planet("naporar", 60, 150, MapColor.Green),
  planet("sposia", 30, 220, MapColor.Green),
  planet("sarvchi", 180, -160, MapColor.Yellow),
  planet("rhigar", 20, -260, MapColor.Aqua),
  planet("kinoss", -260, 30, MapColor.Gray),
  planet("cormit", 260, -20, MapColor.Red),
];

const representativeSpacelanes: ISpacelane[] = [
  lane(
    "chasdemonus-route",
    [
      [-260, 30],
      [-120, 40],
      [0, 0],
    ],
    MapColor.Gray,
  ),
  lane(
    "path-of-the-houses",
    [
      [0, 0],
      [180, -160],
    ],
    MapColor.Yellow,
  ),
  lane(
    "way-of-schesa",
    [
      [0, 0],
      [60, 150],
      [30, 220],
    ],
    MapColor.Green,
  ),
  lane(
    "vaagari-corridor",
    [
      [0, 0],
      [260, -20],
    ],
    MapColor.Red,
  ),
];

const legendEntries: ILegendEntry[] = [
  { id: "core", label: "Core Territory", color: MapColor.Blue },
  { id: "route", label: "Trade Route", color: MapColor.Yellow },
];

const meta: Meta<typeof GalaxyMap> = {
  title: "GalaxyMap",
  component: GalaxyMap,
  args: {
    dimensions,
    renderLimits: defaultRenderLimits,
  },
};

export default meta;

type Story = StoryObj<typeof GalaxyMap>;
type GalaxyMapArgs = ComponentProps<typeof GalaxyMap>;

export const Default: Story = {
  args: {
    planets: representativePlanets,
    spacelanes: representativeSpacelanes,
    legendEntries,
  },
};

export const AtRenderCapLimits: Story = {
  args: {
    planets: representativePlanets,
    spacelanes: representativeSpacelanes,
    renderLimits: { planets: 3, planetLabels: 3, spacelanes: 1 },
  },
};

export const DenseLabelCollision: Story = {
  args: {
    planets: Array.from({ length: 30 }, (_, i) =>
      planet(
        `dense-${i}`,
        (i % 6) * 25 - 60,
        Math.floor(i / 6) * 25 - 60,
        MapColor.Blue,
      ),
    ),
    spacelanes: [],
  },
};

export const MultiSegmentSpacelane: Story = {
  args: {
    planets: [
      planet("x", -150, 0, MapColor.Red),
      planet("y", 0, 100, MapColor.Green),
      planet("z", 150, 0, MapColor.Blue),
    ],
    spacelanes: [
      {
        id: "multi",
        segments: [
          {
            origin: { x: -150, y: 0 },
            destination: { x: 0, y: 100 },
            color: MapColor.Red,
          },
          {
            origin: { x: 0, y: 100 },
            destination: { x: 150, y: 0 },
            color: MapColor.Blue,
          },
        ],
      },
    ],
  },
};

export const SelectedStates: Story = {
  args: {
    planets: representativePlanets,
    spacelanes: representativeSpacelanes,
    selectedPlanetId: "csilla",
    selectedSpaceLaneId: "path-of-the-houses",
  },
};

export const ZoomBoundsEnforced: Story = {
  args: {
    planets: representativePlanets,
    spacelanes: representativeSpacelanes,
    zoom: { initial: 1, min: 0.5, max: 2 },
  },
};

export const EmptyState: Story = {
  args: {
    planets: [],
    spacelanes: [],
  },
};

export const LegendVisible: Story = {
  args: {
    planets: representativePlanets,
    spacelanes: representativeSpacelanes,
    legendEntries,
  },
};

export const LegendAbsent: Story = {
  args: {
    planets: representativePlanets,
    spacelanes: representativeSpacelanes,
  },
};

export const LegendExpandedOnLargeScreen: Story = {
  args: {
    planets: representativePlanets,
    spacelanes: representativeSpacelanes,
    legendEntries,
  },
  parameters: {
    viewport: { defaultViewport: "responsive" },
  },
};

export const LegendCollapsedOnSmallScreen: Story = {
  args: {
    planets: representativePlanets,
    spacelanes: representativeSpacelanes,
    legendEntries,
  },
  parameters: {
    viewport: { defaultViewport: "mobile1" },
  },
};

export const OptionsPanelRenderLimitValues: Story = {
  args: {
    planets: representativePlanets,
    spacelanes: representativeSpacelanes,
    renderLimits: { planets: 0, planetLabels: 0, spacelanes: 100 },
  },
};

export const OptionsPanelAboveDefaultWarning: Story = {
  render: (args: GalaxyMapArgs) => {
    return <GalaxyMap {...args} />;
  },
  args: {
    planets: representativePlanets,
    spacelanes: representativeSpacelanes,
    renderLimits: { planets: 2, planetLabels: 2, spacelanes: 2 },
  },
  parameters: {
    docs: {
      description: {
        story:
          "Raise a limit above the consumer default in the options panel to see the warning indicator.",
      },
    },
  },
};

export const OptionsPanelCollapsedOnSmallScreen: Story = {
  args: {
    planets: representativePlanets,
    spacelanes: representativeSpacelanes,
  },
  parameters: {
    viewport: { defaultViewport: "mobile1" },
  },
};

export const OptionsPanelWithCustomOptions: Story = {
  args: {
    planets: representativePlanets,
    spacelanes: representativeSpacelanes,
    mapOptions: {
      customOptions: <button type="button">Reset to defaults</button>,
    },
  },
};

export const AllOverlaySlotsPopulated: Story = {
  args: {
    planets: representativePlanets,
    spacelanes: representativeSpacelanes,
    legendEntries,
    leftChildren: <span>Compass</span>,
    rightChildren: <span>Actions</span>,
  },
  render: (args: GalaxyMapArgs) => (
    <GalaxyMap {...args}>
      <span>Galaxy Explorer</span>
    </GalaxyMap>
  ),
};

export const CenterChildrenSlotOnly: Story = {
  args: {
    planets: representativePlanets,
    spacelanes: representativeSpacelanes,
  },
  render: (args: GalaxyMapArgs) => (
    <GalaxyMap {...args}>
      <span>Galaxy Explorer</span>
    </GalaxyMap>
  ),
};
