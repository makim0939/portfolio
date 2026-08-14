// アバター入りサムネイルの見た目を決める値。
// 作業場のページと撮影スクリプトが同じ形で受け渡すために、ここに集めている。

import { type AvatarMotion, DEFAULT_AVATAR_MOTION, isAvatarMotion } from "./avatarMotion";

/** 書き出す大きさ。SNSのカードで切り抜かれる比率に合わせている */
export const THUMBNAIL_SIZE = { width: 1200, height: 630 };

/** 題名の改行に使う区切り。シェルから渡すので改行文字そのものは使わない */
export const TITLE_LINE_SEPARATOR = "|";

export type ThumbnailDesign = {
	/** 大きく出す題名。行ごとに分けて渡す */
	titleLines: string[];
	/** 題名の下に小さく添える一行 */
	subtitle: string;
	/** 左上の丸いラベル。カテゴリ名を入れることが多い */
	label: string;
	/** 右に貼る写真。public からのパス。空なら文字とアバターだけになる */
	photo: string;
	motion: AvatarMotion;
	/** モーションを止める時刻（秒）。同じ値なら必ず同じポーズになる */
	time: number;
};

const DEFAULT_DESIGN: ThumbnailDesign = {
	titleLines: ["ここに題名を", "入れます"],
	subtitle: "ここに一行の説明を入れます",
	label: "ラベル",
	photo: "",
	motion: DEFAULT_AVATAR_MOTION,
	time: 0,
};

/** クエリからサムネイルの指定を読む。書かれていない項目は既定値のまま */
export function parseThumbnailDesign(params: URLSearchParams): ThumbnailDesign {
	const title = params.get("title");
	const subtitle = params.get("subtitle");
	const label = params.get("label");
	const photo = params.get("photo");
	const motion = params.get("motion");
	const time = Number(params.get("time"));

	return {
		titleLines: title ? title.split(TITLE_LINE_SEPARATOR) : DEFAULT_DESIGN.titleLines,
		subtitle: subtitle ?? DEFAULT_DESIGN.subtitle,
		label: label ?? DEFAULT_DESIGN.label,
		photo: photo ?? DEFAULT_DESIGN.photo,
		motion: isAvatarMotion(motion) ? motion : DEFAULT_DESIGN.motion,
		time: Number.isFinite(time) && time > 0 ? time : DEFAULT_DESIGN.time,
	};
}

/** 指定をクエリに戻す。作業場が撮影スクリプトの引数を組み立てるのに使う */
export function thumbnailDesignToQuery(design: ThumbnailDesign): URLSearchParams {
	return new URLSearchParams({
		title: design.titleLines.join(TITLE_LINE_SEPARATOR),
		subtitle: design.subtitle,
		label: design.label,
		photo: design.photo,
		motion: design.motion,
		time: design.time.toFixed(2),
	});
}
