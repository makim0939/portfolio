import { MDXRemote } from "next-mdx-remote/rsc";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeSlug from "rehype-slug";
import { Text } from "./Text";
import { StyledLink } from "./StyledLink";

export function MDXContent({ source }: { source: string }) {
	const mdxComponents = {
		h2: ({ children }: { children: React.ReactNode }) => (
			<Text variant="h2" className=" tracking-[0.15em] lg:tracking-[0.21em] ">
				{children}
			</Text>
		),
		p: ({ children }: { children: React.ReactNode }) => (
			<Text variant="p" className=" tracking-[0.03em] lg:tracking-[0.06em] ">
				{children}
			</Text>
		),
		a: ({ children, href }: { children: React.ReactNode; href: string }) => (
			<StyledLink href={href} className="text-sm md:text-base">
				<u>{children}</u>
			</StyledLink>
		),
	};
	return (
		<div className="prose prose-neutral max-w-none">
			<MDXRemote
				source={source}
				options={{
					mdxOptions: {
						remarkPlugins: [],
						rehypePlugins: [[rehypeSlug], [rehypeAutolinkHeadings, { behavior: "append" }]],
					},
				}}
				components={mdxComponents}
			/>
		</div>
	);
}
