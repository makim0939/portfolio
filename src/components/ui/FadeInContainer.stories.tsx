import type { Meta, StoryObj } from "@storybook/nextjs";
import { Text } from "./Text";
import { FadeInContainer } from "./FadeInContainer";

const meta: Meta<typeof FadeInContainer> = {
	component: FadeInContainer,
};

export default meta;
type Story = StoryObj<typeof FadeInContainer>;

export const Default: Story = {
	render: () => (
		<FadeInContainer className="flex flex-col gap-4 ">
			<p>こんにちは</p>
			<p>たこやき</p>
			<p>おこのみ</p>
			<p>たいやき</p>
			<div className=" p-2 w-80 h-64 rounded-2xl border border-neutral-400 shadow-lg ">
				<div className=" w-full h-3/4 rounded-lg bg-blue-400" />
			</div>
		</FadeInContainer>
	),
};
