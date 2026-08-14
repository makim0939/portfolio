// アバター入りサムネイルの見た目を決める値。
// 作業場のページと撮影スクリプトが同じ形で受け渡すために、ここに集めている。

import { type AvatarMotion, DEFAULT_AVATAR_MOTION, isAvatarMotion } from "./avatarMotion";

/** 書き出す大きさ。SNSのカードで切り抜かれる比率に合わせている */
export const THUMBNAIL_SIZE = { width: 1200, height: 630 };

/** 題名の改行に使う区切り。シェルから渡すので改行文字そのものは使わない */
export const TITLE_LINE_SEPARATOR = "|";

/** 写真の置き方。左上を原点にした位置と大きさで持つ */
export type PhotoLayout = {
	x: number;
	y: number;
	width: number;
	height: number;
	/** 傾き（度） */
	rotation: number;
	/** アバターより手前に出す。既定では奥に置く */
	inFront: boolean;
	/**
	 * 枠に対して写真のどこを見せるか（0〜100%）。
	 * 枠から溢れた分は切り落とされるので、これで見せたいところに寄せる。
	 */
	trimX: number;
	trimY: number;
};

/**
 * アバターの置き方。
 *
 * アバターは決まった大きさの枠に描いていて、枠ごと動かして拡げる。
 * 枠を大きくすればアバターも大きくなり、サムネイルから溢れた分は切り落とされる。
 */
export type AvatarLayout = {
	x: number;
	y: number;
	/** 基準の大きさに対する倍率。縦横まとめて掛けるので、比率は崩れない */
	scale: number;
};

/** アバターの枠の基準の大きさ。倍率1のときはこの大きさになる */
export const AVATAR_BASE_SIZE = { width: 380, height: 630 };

/** 骨ごとの回転（ラジアン）。動きを止めたうえで、この分だけ姿勢を上書きする */
export type BonePose = Record<string, [number, number, number]>;

export type ThumbnailDesign = {
	/** 大きく出す題名。行ごとに分けて渡す */
	titleLines: string[];
	/** 題名の下に小さく添える一行 */
	subtitle: string;
	/** 左上の丸いラベル。カテゴリ名を入れることが多い */
	label: string;
	/** 右に貼る写真。public からのパス。空なら文字とアバターだけになる */
	photo: string;
	photoLayout: PhotoLayout;
	avatarLayout: AvatarLayout;
	motion: AvatarMotion;
	/** モーションを止める時刻（秒）。同じ値なら必ず同じポーズになる */
	time: number;
	/** 骨を触って直した分。触っていなければ空 */
	pose: BonePose;
};

/** 写真の既定の置き方。右上に少し傾けて貼る */
export const DEFAULT_PHOTO_LAYOUT: PhotoLayout = {
	x: 752,
	y: 46,
	width: 392,
	height: 523,
	rotation: 2.5,
	inFront: false,
	trimX: 50,
	trimY: 50,
};

/** アバターの既定の置き方。文字の右、写真との間あたりに立つ */
export const DEFAULT_AVATAR_LAYOUT: AvatarLayout = { x: 500, y: 0, scale: 1 };

const DEFAULT_DESIGN: ThumbnailDesign = {
	titleLines: ["ここに題名を", "入れます"],
	subtitle: "ここに一行の説明を入れます",
	label: "ラベル",
	photo: "",
	photoLayout: DEFAULT_PHOTO_LAYOUT,
	avatarLayout: DEFAULT_AVATAR_LAYOUT,
	motion: DEFAULT_AVATAR_MOTION,
	time: 0,
	pose: {},
};

/** 壊れた JSON が来ても画面ごと落ちないように、読めなければ既定値に戻す */
function parseJson<T>(value: string | null, fallback: T): T {
	if (!value) return fallback;
	try {
		return JSON.parse(value) as T;
	} catch {
		return fallback;
	}
}

/** クエリからサムネイルの指定を読む。書かれていない項目は既定値のまま */
export function parseThumbnailDesign(params: URLSearchParams): ThumbnailDesign {
	const title = params.get("title");
	const time = Number(params.get("time"));
	const motion = params.get("motion");

	return {
		titleLines: title ? title.split(TITLE_LINE_SEPARATOR) : DEFAULT_DESIGN.titleLines,
		subtitle: params.get("subtitle") ?? DEFAULT_DESIGN.subtitle,
		label: params.get("label") ?? DEFAULT_DESIGN.label,
		photo: params.get("photo") ?? DEFAULT_DESIGN.photo,
		photoLayout: {
			...DEFAULT_PHOTO_LAYOUT,
			...parseJson<Partial<PhotoLayout>>(params.get("layout"), {}),
		},
		avatarLayout: {
			...DEFAULT_AVATAR_LAYOUT,
			...parseJson<Partial<AvatarLayout>>(params.get("avatar"), {}),
		},
		motion: isAvatarMotion(motion) ? motion : DEFAULT_DESIGN.motion,
		time: Number.isFinite(time) && time > 0 ? time : DEFAULT_DESIGN.time,
		pose: parseJson<BonePose>(params.get("pose"), DEFAULT_DESIGN.pose),
	};
}

/**
 * 指定をクエリに戻す。
 * 画面から書き出すときも、この形にしてから撮影スクリプトへ渡す。
 */
export function thumbnailDesignToQuery(design: ThumbnailDesign): URLSearchParams {
	const params = new URLSearchParams({
		title: design.titleLines.join(TITLE_LINE_SEPARATOR),
		subtitle: design.subtitle,
		label: design.label,
		photo: design.photo,
		motion: design.motion,
		time: design.time.toFixed(2),
	});

	// 触っていないものは書かない。コマンドが読みづらくなるだけなので
	if (!isSame(design.photoLayout, DEFAULT_PHOTO_LAYOUT)) {
		params.set("layout", JSON.stringify(design.photoLayout));
	}
	if (!isSame(design.avatarLayout, DEFAULT_AVATAR_LAYOUT)) {
		params.set("avatar", JSON.stringify(design.avatarLayout));
	}
	if (Object.keys(design.pose).length > 0) {
		params.set("pose", JSON.stringify(design.pose));
	}

	return params;
}

function isSame<T extends object>(a: T, b: T) {
	return (Object.keys(b) as (keyof T)[]).every((key) => a[key] === b[key]);
}
