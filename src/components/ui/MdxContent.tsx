import { MDXRemote } from "next-mdx-remote/rsc";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeSlug from "rehype-slug";

export function MDXContent({ source }: { source: string }) {
	return (
		<div className="prose prose-neutral max-w-none">
			<MDXRemote
				source={source}
				options={{
					mdxOptions: {
						remarkPlugins: [],
						rehypePlugins: [
							[rehypeSlug],
							[rehypeAutolinkHeadings, { behavior: "append" }],
						],
					},
				}}
				components={{}}
			/>
		</div>
	);
}
