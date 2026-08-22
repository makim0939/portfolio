// ArtStationに上げた画像を、本文にそのまま貼れるようにするための変換。
// 絵の原本はArtStationに置いたままにして、このリポジトリには持ち込まない。

/** ArtStationのCDN。画像のURLは cdna / cdnb のどちらかから始まる */
const ARTSTATION_CDN = /^https:\/\/cdn[ab]\.artstation\.com\/p\/assets\//;

/**
 * ArtStationの画像URLは、途中の一区切りが大きさになっている。
 * .../assets/images/images/072/446/941/<大きさ>/makimura-asset.jpg?1707382318
 * サイトから拾ったURLは小さい版（smaller_square など）を指していることが多いので、
 * 本文に貼る用の大きい版に差し替える。original は403で取れないため large を使う。
 */
const ARTSTATION_SIZES = [
	"smaller_square",
	"small_square",
	"micro_square",
	"micro",
	"small",
	"medium",
	"large",
	"4k",
	"original",
];

export function isArtstationImage(src: string): boolean {
	return ARTSTATION_CDN.test(src);
}

/** 貼られたURLがどの大きさを指していても、本文に出す大きさに揃える */
export function artstationImageUrl(src: string, size = "large"): string {
	if (!isArtstationImage(src)) return src;
	const pattern = new RegExp(`/(${ARTSTATION_SIZES.join("|")})/`);
	return pattern.test(src) ? src.replace(pattern, `/${size}/`) : src;
}

/**
 * 画面の幅に合わせて選べるように、Next.js の画像最適化を通したURLを組み立てる。
 * ArtStationの原本（large）を元に webp へ変換されるので、絵を圧縮してから
 * 上げ直さなくても、訪問者が受け取る大きさだけが小さくなる。
 *
 * 幅は Next.js の deviceSizes にある値だけを使う。無い値を渡すと400になる。
 */
const OPTIMIZED_WIDTHS = [640, 828, 1200, 1920];
const OPTIMIZED_QUALITY = 75;

function optimizedUrl(src: string, width: number): string {
	return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${OPTIMIZED_QUALITY}`;
}

/** 本文の img に渡す src と srcSet。ArtStation以外のURLはそのまま返す */
export function artstationImageProps(src: string): { src: string; srcSet?: string } {
	if (!isArtstationImage(src)) return { src };
	const large = artstationImageUrl(src);
	return {
		src: optimizedUrl(large, 1200),
		srcSet: OPTIMIZED_WIDTHS.map((width) => `${optimizedUrl(large, width)} ${width}w`).join(", "),
	};
}
