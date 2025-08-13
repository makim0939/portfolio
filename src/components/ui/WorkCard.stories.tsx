import type { Meta, StoryObj } from "@storybook/react";
import Text from "./Text";
import { WorkCard } from "./WorkCard";

const meta: Meta<typeof WorkCard> = {
	component: WorkCard,
};

export default meta;
type Story = StoryObj<typeof WorkCard>;

export const Default: Story = {
	args: {
		work: {
			title: "Storybook Test WorkCardコンポーネント",
			description: "StorybookでWorkカードコンポーネントの動作テスト",
			slug: "storybook-workcard-test",
			date: "2025-09-01", // YYYY-MM-DD
			coverImage: "/test-work.png",
			tags: ["storybook", "typescript", "react"],
			published: false,
			body: "本文",
		},
	},
};
