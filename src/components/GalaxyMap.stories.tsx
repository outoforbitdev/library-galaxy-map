import type { Meta, StoryObj } from "@storybook/react";
import Map from "./GalaxyMap";

const meta: Meta<typeof Map> = {
  title: "GalaxyMap",
  component: Map,
};

export default meta;
type Story = StoryObj<typeof Map>;

export const Default: Story = {
  args: {
    planets: [],
    spacelanes: [],
    dimensions: { minX: 0, minY: 0, maxX: 100, maxY: 100 },
  },
};
