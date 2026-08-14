import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import type { BlogCategory } from "./blogCategories";
import { getAllArticleOgps } from "./zenn";

export type PostFront = {
	title: string;
	description?: string;
	slug: string;
	date: string; // YYYY-MM-DD
	category: BlogCategory;
	/** public/blog からの相対パス。省略すると既定のサムネイルを生成する */
	thumbnail?: string;
	/** 記事上部の大きな画像。省略するとサムネイルを使う */
	coverImage?: string;
	tags?: string[];
	published?: boolean;
};

export type Post = PostFront & { body: string };

/** 自前の記事とZennの記事を1つの一覧に混ぜるので、カードが必要とする形に寄せる */
export type BlogEntry = {
	title: string;
	description?: string;
	date: string;
	category: BlogCategory;
	href: string;
	/** Zennの記事はサイト外なので、別タブで開く */
	isExternal: boolean;
	image: string;
	emoji?: string;
	likedCount?: number;
	tags?: string[];
};

const BLOG_DIR = path.join(process.cwd(), "src", "contents", "blog");

/** 画像を置かなかった記事のサムネイルを作るルート */
export function generatedThumbnailPath(slug: string): string {
	return `/blog/${slug}/thumbnail`;
}

export function postThumbnailPath(post: PostFront): string {
	return post.thumbnail ? `/blog/${post.thumbnail}` : generatedThumbnailPath(post.slug);
}

/**
 * 記事の上部に敷く画像。用意した画像がなければ返さない。
 * 生成したサムネイルには題名が入っているので、その上にさらに題名を重ねると二重になるため。
 */
export function postCoverPath(post: PostFront): string | undefined {
	if (post.coverImage) return `/blog/${post.coverImage}`;
	if (post.thumbnail) return `/blog/${post.thumbnail}`;
	return undefined;
}

export async function getAllPosts(): Promise<Post[]> {
	const files = await fs.readdir(BLOG_DIR).catch(() => []);
	const posts: Post[] = [];
	for (const file of files) {
		if (!file.endsWith(".mdx")) continue;
		const raw = await fs.readFile(path.join(BLOG_DIR, file), "utf8");
		const { data, content } = matter(raw);
		const front = data as PostFront;
		if (front.published === false) continue;
		posts.push({ ...front, body: content });
	}
	return posts.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export async function getPostBySlug(slug: string): Promise<Post | undefined> {
	const all = await getAllPosts();
	return all.find((post) => post.slug === slug);
}

function toEntry(post: Post): BlogEntry {
	return {
		title: post.title,
		description: post.description,
		date: post.date,
		category: post.category,
		href: `/blog/${post.slug}`,
		isExternal: false,
		image: postThumbnailPath(post),
		tags: post.tags,
	};
}

/**
 * 一覧に出す記事を、Zennと自前のぶんまとめて新しい順に返す。
 * Zennの取得が失敗しても自前の記事は出したいので、外部の失敗はここで握りつぶす。
 */
export async function getBlogEntries(): Promise<BlogEntry[]> {
	const posts = await getAllPosts();

	const zennEntries = await getAllArticleOgps()
		.then((ogps) =>
			ogps.map<BlogEntry>((ogp) => ({
				title: ogp.title,
				description: ogp.description,
				date: ogp.lastUpdate,
				category: "tech",
				href: ogp.url,
				isExternal: true,
				image: ogp.image,
				emoji: ogp.emoji,
				likedCount: ogp.likedCount,
			})),
		)
		.catch((e) => {
			console.error("Failed to fetch Zenn articles:", e);
			return [];
		});

	return [...posts.map(toEntry), ...zennEntries].sort((a, b) => (a.date < b.date ? 1 : -1));
}
