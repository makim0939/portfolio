import type { Meta, StoryObj } from "@storybook/nextjs";
import { AudioPlayer } from "./AudioPlayer";
import { AudioPlayerProvider } from "./AudioPlayerProvider";
import { MiniPlayer } from "./MiniPlayer";

const track = {
	slug: "storybook-audio-test",
	title: "Storybook Test MiniPlayerコンポーネント",
	src: "/works/test-tone.mp3",
	artwork: "/works/test-work.png",
};

const meta: Meta<typeof MiniPlayer> = {
	component: MiniPlayer,
	parameters: {
		// 曲のページを離れている状態。作品ページと同じURLだとミニプレイヤーは出ない
		nextjs: { appDirectory: true, navigation: { pathname: "/blog" } },
	},
};

export default meta;
type Story = StoryObj<typeof MiniPlayer>;

/**
 * 曲を載せていないと何も出ないので、上のプレイヤーで再生を押すと画面の下に現れる。
 * 一時停止しても出たままで、消えるのは「閉じる」を押したときだけ。
 */
export const Default: Story = {
	render: () => (
		<AudioPlayerProvider>
			<AudioPlayer track={track} />
			<MiniPlayer />
		</AudioPlayerProvider>
	),
};
