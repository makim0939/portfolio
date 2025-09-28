import type { Meta, StoryObj } from "@storybook/nextjs";
import SocialLinkIcon from "./SocialLinkIcon";
import GithubLogo from "./icons/GithubLogo";

const meta: Meta<typeof SocialLinkIcon> = {
	component: SocialLinkIcon,
};

export default meta;
type Story = StoryObj<typeof SocialLinkIcon>;

export const Default: Story = {
	args: {
		socialLinkData: {
			name: "github",
			url: "https://github.com/",
			logo: GithubLogo,
		},
		svgAttr: { fill: "#757578" },
	},
};
