import ArtstationLogo from "@/components/ui/icons/ArtstationLogo";
import GithubLogo from "@/components/ui/icons/GithubLogo";
import XLogo from "@/components/ui/icons/XLogo";
import type { JSX } from "react";

export type SocialLogoProps = React.SVGAttributes<SVGElement>;
export type SocialLinkData = {
	name: string;
	url: string;
	logo: (props: SocialLogoProps) => JSX.Element;
};
export const socialLinks: SocialLinkData[] = [
	{
		name: "github",
		url: "https://github.com/makim0939",
		logo: GithubLogo,
	},
	{
		name: "x",
		url: "https://x.com/mkmr3329",
		logo: XLogo,
	},
	{
		name: "artstation",
		url: "https://makimura.artstation.com/",
		logo: ArtstationLogo,
	},
];
