import Link, { type LinkProps } from "next/link";

type GlobalNavItemProps = {
	children: React.ReactNode;
} & LinkProps;

const GlobalNavItem = ({ children, ...props }: GlobalNavItemProps) => {
	return (
		<Link {...props} className=" flex flex-col items-center justify-center ">
			{children}
		</Link>
	);
};

export default GlobalNavItem;
