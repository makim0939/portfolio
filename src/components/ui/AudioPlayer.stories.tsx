import type { Meta, StoryObj } from "@storybook/nextjs";
import { AudioPlayer } from "./AudioPlayer";

const meta: Meta<typeof AudioPlayer> = {
	component: AudioPlayer,
};

export default meta;
type Story = StoryObj<typeof AudioPlayer>;

/** 曲の絵がある作品。押すまで音源を読み込まないので、最初は長さが --:-- になる */
export const Default: Story = {
	args: {
		title: "Storybook Test AudioPlayerコンポーネント",
		src: "/works/test-tone.mp3",
		type: "audio/mpeg",
		artwork: "/works/test-work.png",
	},
};

/** 絵を用意していない曲。音符の印を代わりに出す */
export const WithoutArtwork: Story = {
	args: {
		...Default.args,
		artwork: undefined,
	},
};
