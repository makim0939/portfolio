import type { Meta, StoryObj } from "@storybook/nextjs";
import { BlogCard } from "./BlogCard";

const meta: Meta<typeof BlogCard> = {
	component: BlogCard,
};

export default meta;
type Story = StoryObj<typeof BlogCard>;

export const Zenn: Story = {
	args: {
		entry: {
			title: "Ogpコンポーネントのテスト",
			emoji: "🔍",
			description: "画像はZennのOgpの画像です。",
			image:
				"https://res.cloudinary.com/zenn/image/upload/s--lxODzBOx--/c_fit%2Cg_north_west%2Cl_text:notosansjp-medium.otf_55:%25E3%2580%2590React%25E3%2580%2591%25E3%2582%25B8%25E3%2583%25A3%25E3%2582%25A4%25E3%2583%25AD%25E3%2582%25BB%25E3%2583%25B3%25E3%2582%25B5%25E3%2581%25AB%25E3%2582%2588%25E3%2582%258B%25E3%2582%25A4%25E3%2583%25B3%25E3%2582%25BF%25E3%2583%25A9%25E3%2582%25AF%25E3%2582%25B7%25E3%2583%25A7%25E3%2583%25B3%25E3%2582%2592%25E5%25AE%259F%25E7%258F%25BE%25E3%2581%2599%25E3%2582%258B%2Cw_1010%2Cx_90%2Cy_100/g_south_west%2Cl_text:notosansjp-medium.otf_37:%2520Makimura%2520%2Cx_203%2Cy_121/g_south_west%2Ch_90%2Cl_fetch:aHR0cHM6Ly9zdG9yYWdlLmdvb2dsZWFwaXMuY29tL3plbm4tdXNlci11cGxvYWQvYXZhdGFyLzQ3ZTE1MjMxZmYuanBlZw==%2Cr_max%2Cw_90%2Cx_87%2Cy_95/v1627283836/default/og-base-w1200-v2.png",
			date: "2025-09-17",
			category: "tech",
			href: "https://zenn.dev/makimura3329",
			isExternal: true,
			likedCount: 128,
		},
	},
};

export const Post: Story = {
	args: {
		entry: {
			title: "ホームページをリニューアルしました",
			description: "3DCGの部屋を置いたポートフォリオサイトに作り替えました。",
			image: "/dummy_image.png",
			date: "2026-08-14",
			category: "dev",
			href: "/blog/renewal",
			isExternal: false,
		},
	},
};
