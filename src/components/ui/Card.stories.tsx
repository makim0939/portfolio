import type { Meta, StoryObj } from "@storybook/nextjs";
import { Card, CardContents, CardCover } from "./Card";
import { Text } from "./Text";

const meta: Meta<typeof Card> = {
	component: Card,
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
	args: {
		children: (
			<>
				<CardCover src={"/dummy_image.png"} />
				<CardContents>
					<Text variant="h3">カードコンポーネント</Text>
					<Text variant="p">
						制作物やブログの表示に使用します。カードの幅に応じて、レイアウトが切り替わります（スクエア
						or 横長）。
					</Text>
				</CardContents>
			</>
		),
	},
};
