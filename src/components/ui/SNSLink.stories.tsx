import type { Meta, StoryObj } from "@storybook/react";
import SNSLink from "./SNSLink";

const meta: Meta<typeof SNSLink> = {
	component: SNSLink,
};

export default meta;
type Story = StoryObj<typeof SNSLink>;

export const Default: Story = {
	args: {
		snsName: "github",
		svgAttr: { fill: "#757578" },
	},
};
