import type { Meta, StoryObj } from "@storybook/nextjs";
import { RoadmapCard } from "./RoadmapCard";

const meta: Meta<typeof RoadmapCard> = {
	component: RoadmapCard,
};

export default meta;
type Story = StoryObj<typeof RoadmapCard>;

/** 文だけの Issue */
export const Todo: Story = {
	args: {
		item: {
			number: 42,
			title: "Issueと連携した制作ロードマップの公開",
			summary: "Webサイトの中で、今後盛り込みたい機能をワクワクするUIで公開する。",
			items: [],
			status: "todo",
			url: "https://github.com/makim0939/portfolio/issues/42",
			createdAt: "2026-08-09",
		},
	},
};

/** チェックボックス付きの箇条書きを持つ Issue */
export const WipWithChecklist: Story = {
	args: {
		item: {
			number: 36,
			title: "キャラクターに「手を振る」以外のモーションを作成する",
			summary: "追加するモーション",
			items: [
				{ text: "PC作業をする", done: true },
				{ text: "ギター／ピアノを弾く", done: false },
				{ text: "寝る", done: false },
			],
			status: "wip",
			url: "https://github.com/makim0939/portfolio/issues/36",
			createdAt: "2026-08-08",
		},
	},
};

/** 件数が多く、「ほか N 件」にまとまる Issue */
export const TodoWithManyBullets: Story = {
	args: {
		item: {
			number: 43,
			title: "キャラクターモーションの遷移",
			summary: "複数のキャラクターモーションが切り替わるようにする。 候補は以下。",
			items: [
				{ text: "インテリアクリックで切り替え。（ユーザが切り替え）" },
				{ text: "時間帯で切り替え。（システムが切り替え）" },
				{ text: "ページ読み込み時にランダムで切り替え。（システムが切り替え）" },
				{ text: "GithubのStatus連携で切り替え。（開発者が切り替え）" },
			],
			status: "todo",
			url: "https://github.com/makim0939/portfolio/issues/43",
			createdAt: "2026-08-09",
		},
	},
};

export const Done: Story = {
	args: {
		item: {
			number: 35,
			title: "時間帯に応じて背景色と光の色をリアルタイムに更新する",
			summary:
				"光の色と角度の更新の実現方法は以下のどちらでも良い。 背景色はシームレスに変わると見にくいため、パターンを用意して切り替える。",
			items: [
				{ text: "時間から計算してシームレスに変更する。" },
				{ text: "朝、昼、夜などのパターンを用意して切り替える。" },
			],
			status: "done",
			url: "https://github.com/makim0939/portfolio/issues/35",
			createdAt: "2026-08-08",
			completedAt: "2026-08-09",
		},
	},
};
