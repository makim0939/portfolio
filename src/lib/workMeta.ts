// 作品の型・カテゴリ・パスの組み立てを works.ts から分けている。works.ts は作品の
// ファイルを読むために node:fs を使うので、ブラウザ側で動く一覧やカードから
// 読み込むとバンドルできないため。

import { youtubeThumbnail } from "./youtube";

/** 一覧のタブは、この宣言順のまま並べる */
export const WORK_CATEGORIES = {
	software: "ソフトウェア",
	cg: "3DCG",
	illustration: "イラスト",
	music: "楽曲",
	cover: "弾いてみた",
} as const;

export type WorkCategory = keyof typeof WORK_CATEGORIES;

/**
 * 一覧の並び順の既定値。小さいほど上に来る。作って出したもの（ソフトウェア・
 * 3DCG・イラスト・楽曲）を先に、人の曲を弾いた「弾いてみた」を後ろに置く。
 */
const CATEGORY_PRIORITY: Record<WorkCategory, number> = {
	software: 0,
	cg: 0,
	illustration: 0,
	music: 10,
	cover: 20,
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
	/**
	 * 今いちばん見てほしい作品。カテゴリや日付に関わらず一覧の先頭に出て、
	 * カードにも印が付く。絞り込んだ後でも、そのカテゴリの先頭に来る。
	 */
	pinned?: boolean;
	tags?: string[];
	published?: boolean;
};

export type Work = WorkFront & { body: string };

/** 一覧の並び替えに使う重み。priority を書いていなければカテゴリの既定値 */
export function workSortWeight(work: WorkFront): number {
	return work.priority ?? CATEGORY_PRIORITY[work.category];
}

/** 一覧に並べる順。ピン留め → 重み → 新しい順 */
export function compareWorks(a: WorkFront, b: WorkFront): number {
	if (Boolean(a.pinned) !== Boolean(b.pinned)) return a.pinned ? -1 : 1;
	const weightDiff = workSortWeight(a) - workSortWeight(b);
	if (weightDiff !== 0) return weightDiff;
	return a.date < b.date ? 1 : -1;
}

/** 一覧のカードに出す画像。用意した画像がなければYouTubeのものを使う */
export function workThumbnailPath(work: WorkFront): string | undefined {
	if (work.thumbnail) return `/works/${work.thumbnail}`;
	return work.videoUrl ? youtubeThumbnail(work.videoUrl) : undefined;
}

export function workCoverPath(work: WorkFront): string | undefined {
	return work.coverImage ? `/works/${work.coverImage}` : undefined;
}
