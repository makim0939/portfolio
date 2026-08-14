// カテゴリの定義だけを blog.ts から分けている。blog.ts は記事ファイルを読むために
// node:fs を使うので、ブラウザ側で動く絞り込みタブから読み込むとバンドルできないため。

/** 一覧のタブは、この宣言順のまま並べる */
export const BLOG_CATEGORIES = {
	tech: "テック",
	dev: "開発日記",
	life: "生活",
} as const;

export type BlogCategory = keyof typeof BLOG_CATEGORIES;

export function isBlogCategory(value: string): value is BlogCategory {
	return value in BLOG_CATEGORIES;
}
