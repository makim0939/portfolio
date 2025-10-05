import Link, { type LinkProps } from "next/link";

type GlobalNavItemProps = {
	children: React.ReactNode;
} & LinkProps;

export function GlobalNavItem({ children, ...props }: GlobalNavItemProps) {
	return (
		<Link {...props} className=" flex flex-col items-center justify-center ">
			{children}
		</Link>
	);
}
