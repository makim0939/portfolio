import { twMerge } from "tailwind-merge";
import { tv } from "tailwind-variants";

type TextProps = {
	variant?: "h1" | "h2" | "h3" | "p" | "small";
	children: React.ReactNode;
} & (React.HTMLAttributes<HTMLHeadingElement> | React.HTMLAttributes<HTMLParagraphElement>);

const text = tv({
	base: " text-maki-black ",
	variants: {
		variant: {
			h1: " text-3xl md:text-4xl 3xl:text-5xl font-bold",
			h2: " text-2xl md:text-3xl 3xl:text-4xl  font-semibold",
			h3: " text-xl md:text-2xl 3xl:text-3xl font-semibold",
			p: " text-base md:text-lg 3xl:text-xl leading-8 md:leading-10",
			small: " text-sm md:text-base text-maki-gray  ",
		},
	},
	compoundVariants: [
		{
			variant: ["h1", "h2", "h3"],
			className: " tracking-[0.21em] ",
		},
		{
			variant: ["p", "small"],
			className: " tracking-[0.06em] ",
		},
	],
	defaultVariants: {
		variant: "p",
	},
});

export function Text({ variant = "p", children, className, ...props }: TextProps) {
	const Tag = variant === "small" ? "p" : variant;

	return (
		<Tag className={twMerge(text({ variant }), className)} {...props}>
			{variant === "small" ? (
				<small className={twMerge(text({ variant }), className)}>{children}</small>
			) : (
				children
			)}
		</Tag>
	);
}
