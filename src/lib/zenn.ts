// lib/zenn.ts
export type OgpData = {
	title: string;
	emoji?: string;
	description?: string;
	image: string;
	lastUpdate: string;
	url: string;
};

type ZennArticle = {
	id: number;
	title: string;
	slug: string;
	path: string;
	emoji: string;
	article_type: "tech" | "idea";
	post_type: string;
	principal_type: string;
	body_letters_count: number;
	body_updated_at: string;
	source_repo_updated_at?: string;
	published_at: string;
	pinned: boolean;
	bookmarked_count: number;
	comments_count: number;
	liked_count: number;
	is_suspending_private: boolean;
	// publication?: any;
	// publication_article_override?: any;
	user: {
		id: number;
		username: string;
		name: string;
		avatar_small_url: string;
	};
};

const username = "makimura3329";

export async function getAllArticles(): Promise<OgpData[]> {
	const res = await fetch(
		`https://zenn.dev/api/articles?username=${username}&order=latest`,
		{ next: { revalidate: 3600 } }, // ISRでキャッシュ
	);
	if (!res.ok) throw new Error("Failed to fetch articles");

	const data = await res.json();

	return data.articles.map((article: ZennArticle) => ({
		title: article.title,
		emoji: article.emoji,
		description: null,
		image: "",
		lastUpdate: article.body_updated_at,
		url: `https://zenn.dev/${article.user.username}/articles/${article.slug}`,
	}));
}

function getMetaContent(html: string, property: string): string {
	const regex = new RegExp(
		`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`,
		"i",
	);
	const match = html.match(regex);
	return match ? match[1] : "";
}

export async function getAllArticleOgps(): Promise<OgpData[]> {
	const articles = await getAllArticles();

	const promiseOgps = articles.map<Promise<OgpData>>(
		async (article): Promise<OgpData> => {
			const html = await fetch(article.url, {
				next: { revalidate: 3600 },
			}).then((res) => res.text());
			article.image = getMetaContent(html, "og:image");
			return article;
		},
	);

	const resolvedOgps = await Promise.all(promiseOgps);

	return resolvedOgps;
}

export async function fetchZennOgp(url: string): Promise<OgpData | null> {
	try {
		const html = await fetch(url).then((res) => res.text());
		console.log(html);

		return {
			title: getMetaContent(html, "og:title"),
			description: getMetaContent(html, "og:description"),
			image: getMetaContent(html, "og:image"),
			lastUpdate: getMetaContent(html, "og:lastBuildDate"),
			url,
		};
	} catch (e) {
		console.error("Failed to fetch OGP:", e);
		return null;
	}
}
