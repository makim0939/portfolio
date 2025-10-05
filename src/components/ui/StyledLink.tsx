import Link, { type LinkProps } from "next/link";
import { twMerge } from "tailwind-merge";

type StyledLinkProps = {
	className?: string;
	children: React.ReactNode;
} & LinkProps;

export function StyledLink({ children, className, ...props }: StyledLinkProps) {
	return (
		<Link
			{...props}
			className={twMerge(
				"text-blue-500 md:text-maki-gray hover:text-blue-500 underline-offset-4 duration-100",
				className,
			)}
		>
			{children}
		</Link>
	);
}
