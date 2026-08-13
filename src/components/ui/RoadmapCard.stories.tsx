import type { Meta, StoryObj } from "@storybook/nextjs";
import { RoadmapCard } from "./RoadmapCard";

const meta: Meta<typeof RoadmapCard> = {
	component: RoadmapCard,
};

export default meta;
type Story = StoryObj<typeof RoadmapCard>;

export const Wip: Story = {
	args: {
		item: {
			number: 42,
			title: "Issueと連携した制作ロードマップの公開",
			description: "Webサイトの中で、今後盛り込みたい機能をワクワクするUIで公開する。",
			status: "wip",
			url: "https://github.com/makim0939/portfolio/issues/42",
			createdAt: "2025-08-09",
		},
	},
};

export const Todo: Story = {
	args: {
		item: {
			number: 41,
			title: "3DCGの部屋の出現アニメーション",
			description: "オブジェクトごとにアニメーションをつけるため、glbを分割する。",
			status: "todo",
			url: "https://github.com/makim0939/portfolio/issues/41",
			createdAt: "2025-08-09",
		},
	},
};

export const Done: Story = {
	args: {
		item: {
			number: 35,
			title: "時間帯に応じて背景色と光の色をリアルタイムに更新する",
			description:
				"光の色と角度の更新の実現方法は以下のどちらでも良い。背景色はシームレスに変わると見にくいため、パターンを用意して切り替える。",
			status: "done",
			url: "https://github.com/makim0939/portfolio/issues/35",
			createdAt: "2025-08-08",
			completedAt: "2025-08-09",
		},
	},
};
