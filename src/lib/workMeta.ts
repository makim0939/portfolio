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

/**
 * 一覧の並び順の既定値。小さいほど上に来る。演奏は趣味の作品も多いので、
 * 仕事寄りのソフトウェア・CGより下に置く。
 */
const CATEGORY_PRIORITY: Record<WorkCategory, number> = {
	software: 0,
	cg: 0,
	music: 10,
};

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
	/**
	 * 一覧の並び順。小さいほど上に来る。省略時はカテゴリの既定値を使うので、
	 * 力を入れた作品をカテゴリの既定より上げたいときだけ書く。
	 */
	priority?: number;
	tags?: string[];
	published?: boolean;
};

export type Work = WorkFront & { body: string };

/** 一覧の並び替えに使う重み。priority を書いていなければカテゴリの既定値 */
export function workSortWeight(work: WorkFront): number {
	return work.priority ?? CATEGORY_PRIORITY[work.category];
}

/** 一覧のカードに出す画像。用意した画像がなければYouTubeのものを使う */
export function workThumbnailPath(work: WorkFront): string | undefined {
	if (work.thumbnail) return `/works/${work.thumbnail}`;
	return work.videoUrl ? youtubeThumbnail(work.videoUrl) : undefined;
}

export function workCoverPath(work: WorkFront): string | undefined {
	return work.coverImage ? `/works/${work.coverImage}` : undefined;
}
