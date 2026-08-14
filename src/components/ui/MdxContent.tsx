import { MDXRemote } from "next-mdx-remote/rsc";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeSlug from "rehype-slug";
import { StyledLink } from "./StyledLink";
import { Text } from "./Text";

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
		/*
			本文の画像。記事ごとに縦横比がまちまちなので、横幅ではなく高さで頭打ちにする。
			横幅だけで抑えると、縦長の写真が画面を埋め尽くして本文が押し出されてしまう。
			記事側で大きさを書いても style は落ちるので、見せ方はここで持つ。
		*/
		img: ({ src, alt }: { src?: string; alt?: string }) => (
			<img
				src={src}
				alt={alt}
				className=" block mx-auto max-h-[70vh] w-auto rounded-2xl shadow-lg "
			/>
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
