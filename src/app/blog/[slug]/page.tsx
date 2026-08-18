import { MDXContent } from "@/components/ui/MdxContent";
import { Text } from "@/components/ui/Text";
import {
	type Post,
	getAllPosts,
	getPostBySlug,
	postCoverPath,
	postThumbnailPath,
} from "@/lib/blog";
import { BLOG_CATEGORIES } from "@/lib/blogCategories";
import { AUTHOR_NAME, SITE_URL, canonicalUrl } from "@/lib/site";
import Image from "next/image";
import { notFound } from "next/navigation";

export async function generateStaticParams() {
	const posts = await getAllPosts();
	return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
	const { slug } = await params;
	const post = await getPostBySlug(slug);
	if (!post) return {};

	const description = post.description ?? "ブログ記事";
	// 画像を用意しなかった記事は、生成したサムネイルがそのままOGP画像になる
	const image = postThumbnailPath(post);

	return {
		title: post.title,
		description,
		// 同じ記事が複数のURLで拾われないように、どれが本物かを示しておく
		alternates: { canonical: `/blog/${post.slug}` },
		authors: [{ name: AUTHOR_NAME }],
		keywords: post.tags,
		openGraph: {
			type: "article",
			title: post.title,
			description,
			url: canonicalUrl(`/blog/${post.slug}`),
			publishedTime: post.date,
			authors: [AUTHOR_NAME],
			tags: post.tags,
			images: [image],
		},
		twitter: {
			card: "summary_large_image",
			title: post.title,
			description,
			images: [image],
		},
	};
}

/**
 * 記事の中身を検索エンジンに読める形で置く。
 * 見た目には出ないが、書いた人・公開日・サムネイルが検索結果に使われる。
 */
function articleJsonLd(post: Post) {
	const url = canonicalUrl(`/blog/${post.slug}`);
	return {
		"@context": "https://schema.org",
		"@type": "BlogPosting",
		headline: post.title,
		description: post.description,
		image: canonicalUrl(postThumbnailPath(post)),
		datePublished: post.date,
		dateModified: post.date,
		author: { "@type": "Person", name: AUTHOR_NAME, url: SITE_URL },
		publisher: { "@type": "Person", name: AUTHOR_NAME, url: SITE_URL },
		mainEntityOfPage: { "@type": "WebPage", "@id": url },
		url,
		keywords: post.tags?.join(", "),
		inLanguage: "ja",
	};
}

/** 題名・日付・カテゴリ・タグ。画像の上に重ねるときは白抜きにする */
function PostHeading({ post, onImage }: { post: Post; onImage: boolean }) {
	const textColor = onImage ? " text-neutral-50 " : "";
	return (
		<div className=" space-y-2 3xl:space-y-4 ">
			<Text variant="h1" className={textColor}>
				{post.title}
			</Text>
			{post.description && <Text className={textColor}>{post.description}</Text>}
			<div className="flex items-center gap-2">
				<Text variant="small" className={textColor}>
					<time dateTime={post.date}>{post.date}</time>
				</Text>
				<ul className="flex gap-1 flex-wrap">
					{[BLOG_CATEGORIES[post.category], ...(post.tags ?? [])].map((label) => (
						<li
							key={label}
							className={` px-2 py-0.5 rounded-full border ${onImage ? " bg-black/10 " : ""} `}
						>
							<Text variant="small" className={` text-[11px] ${textColor} `}>
								{label}
							</Text>
						</li>
					))}
				</ul>
			</div>
		</div>
	);
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
	const { slug } = await params;
	const post = await getPostBySlug(slug);
	if (!post) return notFound();

	const cover = postCoverPath(post);

	return (
		<main>
			{/* 中身は記事のfrontmatterから組み立てたものだけで、外から来た文字は混ざらない */}
			<script
				type="application/ld+json"
				// biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD はこの形でしか埋め込めない
				dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd(post)) }}
			/>
			{cover ? (
				<header
					className=" relative -mx-8 -mt-16 mb-8 h-[40vh]
								lg:-mx-16 lg:-mt-28 lg:mb-16 lg:w-[100vw] lg:h-[60vh]
								3xl:-mx-20 "
				>
					<Image
						src={cover}
						width={1920}
						height={1080}
						alt={post.title}
						className=" absolute w-full h-full object-cover brightness-50 "
					/>
					<div
						className=" absolute px-8 top-1/2 -translate-y-1/2 left-0
									lg:w-full lg:max-w-6xl lg:px-0 lg:left-1/2 lg:-translate-x-1/2 "
					>
						<PostHeading post={post} onImage={true} />
					</div>
				</header>
			) : (
				<header className=" mb-8 lg:mb-16 lg:max-w-6xl lg:m-auto ">
					<PostHeading post={post} onImage={false} />
					<hr className=" mt-8 " />
				</header>
			)}
			<div className=" lg:max-w-6xl lg:min-h-[100vh] lg:m-auto ">
				<MDXContent source={post.body} />
			</div>
		</main>
	);
}
