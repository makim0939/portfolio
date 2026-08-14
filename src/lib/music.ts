import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

export type PerformanceFront = {
	title: string;
	description?: string;
	slug: string;
	date: string; // YYYY-MM-DD
	/** ピアノ、ギターなど。一覧のカードに出す */
	instrument?: string;
	/** YouTubeのURL。動画ファイルを直接置く場合は代わりに video を書く */
	videoUrl?: string;
	/** public/music からの相対パス */
	video?: string;
	/** public/music からの相対パス。省略するとYouTubeのサムネイルを使う */
	thumbnail?: string;
	tags?: string[];
	published?: boolean;
};

export type Performance = PerformanceFront & { body: string };

const MUSIC_DIR = path.join(process.cwd(), "src", "contents", "music");

/** watch・youtu.be・embed・shorts のどの形のURLからでも動画IDを取り出す */
export function youtubeVideoId(url: string): string | undefined {
	const patterns = [
		/youtu\.be\/([\w-]{11})/,
		/[?&]v=([\w-]{11})/,
		/\/embed\/([\w-]{11})/,
		/\/shorts\/([\w-]{11})/,
	];
	for (const pattern of patterns) {
		const matched = url.match(pattern);
		if (matched) return matched[1];
	}
	return undefined;
}

/**
 * カードに出す画像。用意した画像がなければYouTubeのものを使う。
 * maxresdefault は元の動画が高解像度のときだけ存在するので、
 * 出ない動画では thumbnail に画像を指定する。
 */
export function performanceThumbnail(performance: PerformanceFront): string | undefined {
	if (performance.thumbnail) return `/music/${performance.thumbnail}`;

	const videoId = performance.videoUrl ? youtubeVideoId(performance.videoUrl) : undefined;
	return videoId ? `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg` : undefined;
}

export function performanceVideoPath(performance: PerformanceFront): string | undefined {
	return performance.video ? `/music/${performance.video}` : undefined;
}

export async function getAllPerformances(): Promise<Performance[]> {
	const files = await fs.readdir(MUSIC_DIR).catch(() => []);
	const performances: Performance[] = [];
	for (const file of files) {
		if (!file.endsWith(".mdx")) continue;
		const raw = await fs.readFile(path.join(MUSIC_DIR, file), "utf8");
		const { data, content } = matter(raw);
		const front = data as PerformanceFront;
		if (front.published === false) continue;
		performances.push({ ...front, body: content });
	}
	return performances.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export async function getPerformanceBySlug(slug: string): Promise<Performance | undefined> {
	const all = await getAllPerformances();
	return all.find((performance) => performance.slug === slug);
}
