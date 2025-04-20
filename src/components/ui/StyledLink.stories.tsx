import type { Meta, StoryObj } from "@storybook/react";
import StyledLink from "./StyledLink";

const meta: Meta<typeof StyledLink> = {
	component: StyledLink,
};

export default meta;
type Story = StoryObj<typeof StyledLink>;

export const Default: Story = {
	args: {
		href: "",
		children: <u>これはリンクですよ</u>,
	},
};
