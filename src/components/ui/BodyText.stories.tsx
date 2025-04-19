import type { Meta, StoryObj } from "@storybook/react";
import BodyText from "./BodyText";

const meta: Meta<typeof BodyText> = {
	component: BodyText,
};

export default meta;
type Story = StoryObj<typeof BodyText>;

export const Default: Story = {
	args: {
		children: <>Hello World!</>,
	},
};
