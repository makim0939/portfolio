import type { Work } from "@/lib/workMeta";
import type { Meta, StoryObj } from "@storybook/nextjs";
import { Text } from "./Text";
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
			category: "software",
			date: "2025-09-01", // YYYY-MM-DD
			thumbnail: "/test-work.png",
			coverImage: "/test-work.png",
			tags: ["storybook", "typescript", "react"],
			published: false,
			body: "本文",
		},
	},
};

/** ピン留めした作品。カテゴリや日付に関わらず一覧の先頭に出る */
export const Pinned: Story = {
	args: {
		work: {
			...(Default.args?.work as Work),
			title: "ピン留めした制作物",
			pinned: true,
		},
	},
};
