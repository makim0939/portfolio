import type { Meta, StoryObj } from "@storybook/nextjs";
import { AudioPlayer } from "./AudioPlayer";
import { AudioPlayerProvider, type AudioTrack } from "./AudioPlayerProvider";

const track: AudioTrack = {
	slug: "storybook-audio-test",
	title: "Storybook Test AudioPlayerコンポーネント",
	src: "/works/test-tone.mp3",
	artwork: "/works/test-work.png",
};

const meta: Meta<typeof AudioPlayer> = {
	component: AudioPlayer,
	// 音を持っているのは Provider なので、単体で置いても鳴らない
	decorators: [
		(Story) => (
			<AudioPlayerProvider>
				<Story />
			</AudioPlayerProvider>
		),
	],
};

export default meta;
type Story = StoryObj<typeof AudioPlayer>;

/** 曲の絵がある作品。押すまで音源を読み込まないので、最初は長さが --:-- になる */
export const Default: Story = {
	args: { track },
};

/** 絵を用意していない曲。音符の印を代わりに出す */
export const WithoutArtwork: Story = {
	args: {
		track: { ...track, artwork: undefined },
	},
};
