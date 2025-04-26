import Link from "next/link";
import ArtstationLogo from "./icons/ArtstationLogo";
import GithubLogo from "./icons/GithubLogo";
import XLogo from "./icons/XLogo";

type SNSLinkProps = {
	snsName: "github" | "x" | "artstation";
	svgAttr?: React.SVGAttributes<SVGElement>;
};
function SNSLink({ snsName, svgAttr }: SNSLinkProps) {
	return (
		<button type="button" className=" rounded-sm border-2 border-neutral-300">
			<Link href={""} className=" block p-2 w-full h-full">
				{snsName === "github" && <GithubLogo {...svgAttr} />}
				{snsName === "x" && <XLogo {...svgAttr} />}
				{snsName === "artstation" && <ArtstationLogo {...svgAttr} />}
			</Link>
		</button>
	);
}

export default SNSLink;
