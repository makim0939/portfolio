// サイト全体で使う情報。
// 題名の付け方や正規URLの組み立てが各ページに散らばると食い違うので、ここにまとめている。

/** 公開しているURL。正規URLとサイトマップの土台になる */
export const SITE_URL = "https://www.makimura.me";

export const SITE_NAME = "まきむらのポートフォリオ";

export const SITE_DESCRIPTION =
	"ソフトウェアとCGを作っているまきむらのポートフォリオです。Web・3DCG・音楽の制作物と、開発や暮らしのブログを置いています。";

export const AUTHOR_NAME = "まきむら";

/**
 * ページの題名。
 *
 * 検索結果に出るのは前の方だけなので、そのページ自身の名前を先に置いて、
 * サイト名は後ろに添える。トップだけはサイト名がそのまま題名になる。
 */
export function pageTitle(title?: string): string {
	return title ? `${title} | ${SITE_NAME}` : SITE_NAME;
}

/** 正規URL。同じ中身が複数のURLで拾われないように、記事ごとに1つ決めておく */
export function canonicalUrl(pathname: string): string {
	return new URL(pathname, SITE_URL).toString();
}
