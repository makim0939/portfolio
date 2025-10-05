import type { SocialLinkData } from "@/lib/socialLinks";
import Link from "next/link";

type SocialLinkIconProps = {
	socialLinkData: SocialLinkData;
	svgAttr?: React.SVGAttributes<SVGElement>;
};
export function SocialLinkIcon({ socialLinkData, svgAttr }: SocialLinkIconProps) {
	return (
		<button type="button" className=" rounded-sm border-2 border-neutral-300">
			<Link href={socialLinkData.url} target="_blank" className=" block p-2 w-full h-full">
				<socialLinkData.logo {...svgAttr} />
			</Link>
		</button>
	);
}
