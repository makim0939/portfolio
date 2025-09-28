import type { Meta, StoryObj } from "@storybook/nextjs";
import { GlobalNav } from "./GlobalNav";

const meta: Meta<typeof GlobalNav> = {
	component: GlobalNav,
};

export default meta;
type Story = StoryObj<typeof GlobalNav>;

export const Default: Story = {
	args: {},
};
