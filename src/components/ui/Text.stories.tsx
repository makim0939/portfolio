import type { Meta, StoryObj } from "@storybook/nextjs";
import { Text } from "./Text";

const meta: Meta<typeof Text> = {
	component: Text,
};

export default meta;
type Story = StoryObj<typeof Text>;

export const Default: Story = {
	args: {
		variant: "p",
		children: <>今日はいい天気ですね</>,
	},
};
