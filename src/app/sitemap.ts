import { getAllPosts } from "@/lib/blog";
import { SITE_URL } from "@/lib/site";
import { getAllWorks } from "@/lib/works";
import type { MetadataRoute } from "next";

/*
	検索エンジンに渡すページの一覧。

	Zennの記事は向こうのサイトのものなので載せない。こちらのサイトマップに
	書いても拾われないうえ、同じ記事が二重に扱われてしまう。
*/
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const [posts, works] = await Promise.all([getAllPosts(), getAllWorks()]);

	// 記事に紐づかないページの更新日。いちばん新しい記事の日付に合わせる
	const latest = [...posts, ...works]
		.map((item) => item.date)
		.sort()
		.at(-1);
	const lastModified = latest ? new Date(latest) : new Date();

	/** 見てほしい順に重みを付ける。トップがいちばん高く、読み物がそれに次ぐ */
	const pages: MetadataRoute.Sitemap = [
		{ url: SITE_URL, lastModified, changeFrequency: "weekly", priority: 1 },
		{ url: `${SITE_URL}/works`, lastModified, changeFrequency: "weekly", priority: 0.9 },
		{ url: `${SITE_URL}/blog`, lastModified, changeFrequency: "weekly", priority: 0.9 },
		{ url: `${SITE_URL}/about`, lastModified, changeFrequency: "monthly", priority: 0.7 },
		{ url: `${SITE_URL}/roadmap`, lastModified, changeFrequency: "weekly", priority: 0.5 },
		{ url: `${SITE_URL}/contact`, lastModified, changeFrequency: "yearly", priority: 0.3 },
	];

	return [
		...pages,
		...works.map((work) => ({
			url: `${SITE_URL}/works/${work.slug}`,
			lastModified: new Date(work.date),
			changeFrequency: "monthly" as const,
			priority: 0.8,
		})),
		...posts.map((post) => ({
			url: `${SITE_URL}/blog/${post.slug}`,
			lastModified: new Date(post.date),
			changeFrequency: "monthly" as const,
			priority: 0.8,
		})),
	];
}
