import type { SocialLinkData } from "@/lib/socialLinks";
import Link from "next/link";
import ArtstationLogo from "./icons/ArtstationLogo";
import GithubLogo from "./icons/GithubLogo";
import XLogo from "./icons/XLogo";

type SocialLinkIconProps = {
	socialLinkData: SocialLinkData;
	svgAttr?: React.SVGAttributes<SVGElement>;
};
function SocialLinkIcon({ socialLinkData, svgAttr }: SocialLinkIconProps) {
	return (
		<button type="button" className=" rounded-sm border-2 border-neutral-300">
			<Link href={socialLinkData.url} className=" block p-2 w-full h-full">
				<socialLinkData.logo {...svgAttr} />
			</Link>
		</button>
	);
}

export default SocialLinkIcon;
