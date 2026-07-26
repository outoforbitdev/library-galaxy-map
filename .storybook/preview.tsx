import type { Preview } from "@storybook/react";

const preview: Preview = {
  parameters: {},
  decorators: [
    (Story) => (
      <div style={{ width: "100vw", height: "100vh" }}>
        <Story />
      </div>
    ),
  ],
};

export default preview;
