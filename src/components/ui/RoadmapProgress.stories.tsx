import type { Meta, StoryObj } from "@storybook/nextjs";
import { RoadmapProgress } from "./RoadmapProgress";

const meta: Meta<typeof RoadmapProgress> = {
	component: RoadmapProgress,
};

export default meta;
type Story = StoryObj<typeof RoadmapProgress>;

export const Default: Story = {
	args: { done: 3, total: 8 },
};

export const Empty: Story = {
	args: { done: 0, total: 0 },
};

export const Completed: Story = {
	args: { done: 5, total: 5 },
};
