import { ImageResponse } from "next/og";

/** OGPとして扱われる標準の比率。SNSのカードはこの比率で切り抜かれる */
export const OGP_IMAGE_SIZE = { width: 1200, height: 630 };
export const OGP_IMAGE_CONTENT_TYPE = "image/png";

const TEXT_COLOR = "#252528";
const SUB_TEXT_COLOR = "#757578";
const ACCENT_COLOR = "#dd5522";
const SITE_NAME = "makimura.me";

/**
 * 画像に描く文字だけに絞ったフォントを取り寄せる。
 * 日本語のフォントは全体だと数MBあり、そのまま読み込むと画像生成が重すぎるため。
 * 画像生成側は woff2 を読めないので、それを解さない古いUAを名乗って woff をもらう。
 */
async function loadJapaneseFont(text: string): Promise<ArrayBuffer | null> {
	const cssUrl = `https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@700&text=${encodeURIComponent(text)}`;
	try {
		const css = await fetch(cssUrl, {
			headers: {
				"User-Agent": "Mozilla/5.0 (Windows NT 6.1; WOW64; Trident/7.0; rv:11.0) like Gecko",
			},
		}).then((res) => res.text());

		const fontUrl = css.match(/src:\s*url\((https:[^)]+)\)/)?.[1];
		if (!fontUrl) return null;

		return await fetch(fontUrl).then((res) => res.arrayBuffer());
	} catch (e) {
		// フォントが取れなくても画像自体は返したいので、既定のフォントに任せる。
		console.error("Failed to load font for OGP image:", e);
		return null;
	}
}

/**
 * 画像を用意しなかった記事のサムネイル兼OGP画像を作る。
 * 記事ごとに絵を描かなくても、一覧とSNSカードの見た目が崩れないようにするのが目的。
 */
export async function createOgpImage({
	title,
	label,
}: { title: string; label: string }): Promise<ImageResponse> {
	const font = await loadJapaneseFont(`${title}${label}${SITE_NAME}`);

	return new ImageResponse(
		<div
			style={{
				width: "100%",
				height: "100%",
				display: "flex",
				flexDirection: "column",
				justifyContent: "space-between",
				padding: "72px 80px",
				backgroundColor: "#ffffff",
				// 時間帯で色が変わるサイトの地色に馴染むよう、白一色ではなく淡い暖色を敷く
				backgroundImage: "linear-gradient(135deg, #ffffff 0%, #fdf7f2 100%)",
			}}
		>
			<div style={{ display: "flex", alignItems: "center", gap: 20 }}>
				<div style={{ width: 12, height: 48, backgroundColor: ACCENT_COLOR, borderRadius: 6 }} />
				<div style={{ fontSize: 34, color: SUB_TEXT_COLOR }}>{label}</div>
			</div>

			<div
				style={{
					display: "flex",
					fontSize: 68,
					lineHeight: 1.4,
					letterSpacing: "0.04em",
					color: TEXT_COLOR,
				}}
			>
				{title}
			</div>

			<div style={{ display: "flex", fontSize: 32, color: SUB_TEXT_COLOR }}>{SITE_NAME}</div>
		</div>,
		{
			...OGP_IMAGE_SIZE,
			// 空の配列を渡すと「フォントがない」と怒られるので、取れなかったときはキーごと省く
			...(font
				? {
						fonts: [
							{ name: "Noto Sans JP", data: font, weight: 700 as const, style: "normal" as const },
						],
					}
				: {}),
		},
	);
}
