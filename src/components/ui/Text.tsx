import { twMerge } from "tailwind-merge";
import { tv } from "tailwind-variants";

type TextProps = {
	variant?: "h1" | "h2" | "h3" | "p" | "small";
	children: React.ReactNode;
} & (
	| React.HTMLAttributes<HTMLHeadingElement>
	| React.HTMLAttributes<HTMLParagraphElement>
);

const text = tv({
	base: " text-maki-black ",
	variants: {
		variant: {
			h1: " text-3xl md:text-5xl 2xl:text-[64px] font-bold",
			h2: " text-2xl md:text-4xl font-semibold",
			h3: " text-xl md:text-3xl font-semibold",
			p: " text-base md:text-lg leading-8 md:leading-12",
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

function Text({ variant = "p", children, className, ...props }: TextProps) {
	const Tag = variant;

	return (
		<Tag className={twMerge(text({ variant }), className)} {...props}>
			{children}
		</Tag>
	);
}

export default Text;
