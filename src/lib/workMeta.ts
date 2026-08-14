// 作品の型・カテゴリ・パスの組み立てを works.ts から分けている。works.ts は作品の
// ファイルを読むために node:fs を使うので、ブラウザ側で動く一覧やカードから
// 読み込むとバンドルできないため。

import { youtubeThumbnail } from "./youtube";

/** 一覧のタブは、この宣言順のまま並べる */
export const WORK_CATEGORIES = {
	software: "ソフトウェア",
	cg: "CG",
	music: "音楽",
} as const;

export type WorkCategory = keyof typeof WORK_CATEGORIES;

export type WorkFront = {
	title: string;
	description?: string;
	slug: string;
	date: string; // YYYY-MM-DD
	category: WorkCategory;
	/** public/works からの相対パス。YouTubeの作品では省略できる */
	thumbnail?: string;
	coverImage?: string;
	/** YouTubeのURL。書くと、上部の画像の代わりに動画を出す */
	videoUrl?: string;
	tags?: string[];
	published?: boolean;
};

export type Work = WorkFront & { body: string };

/** 一覧のカードに出す画像。用意した画像がなければYouTubeのものを使う */
export function workThumbnailPath(work: WorkFront): string | undefined {
	if (work.thumbnail) return `/works/${work.thumbnail}`;
	return work.videoUrl ? youtubeThumbnail(work.videoUrl) : undefined;
}

export function workCoverPath(work: WorkFront): string | undefined {
	return work.coverImage ? `/works/${work.coverImage}` : undefined;
}
