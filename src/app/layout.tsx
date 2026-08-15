import { GlobalNav } from "@/components/ui/GlobalNav";
import { Text } from "@/components/ui/Text";
import { TimeOfDayTheme } from "@/components/ui/TimeOfDayTheme";
import { AUTHOR_NAME, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import { timeOfDayInitScript } from "@/lib/timeOfDay";
import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";

const notoSansJP = Noto_Sans_JP({ subsets: ["latin"] });

export const metadata: Metadata = {
	// OGP画像などをページ側で相対パスで書けるようにするため、基準のURLを持たせる
	metadataBase: new URL(SITE_URL),
	title: {
		// ページ側で題名を書かなかったときはこれが出る
		default: SITE_NAME,
		// ページ側の題名の後ろにサイト名を添える。検索結果は前から読まれるので、題名を先に置く
		template: `%s | ${SITE_NAME}`,
	},
	description: SITE_DESCRIPTION,
	authors: [{ name: AUTHOR_NAME, url: SITE_URL }],
	creator: AUTHOR_NAME,
	alternates: { canonical: "/" },
	openGraph: {
		type: "website",
		locale: "ja_JP",
		siteName: SITE_NAME,
		url: SITE_URL,
		title: SITE_NAME,
		description: SITE_DESCRIPTION,
	},
	twitter: {
		card: "summary_large_image",
		title: SITE_NAME,
		description: SITE_DESCRIPTION,
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		// 下の script が描画前に data-time を足すため、サーバの HTML とは必ず差が出る。
		<html lang="ja" suppressHydrationWarning>
			<head>
				{/* 埋め込む文字列を組み立てるのは自前の関数だけで、外部入力は混ざらない */}
				{/* biome-ignore lint/security/noDangerouslySetInnerHtml: 描画前に実行する必要があるため */}
				<script dangerouslySetInnerHTML={{ __html: timeOfDayInitScript() }} />
			</head>
			<body className={notoSansJP.className}>
				<TimeOfDayTheme />
				<div className=" p-8 pt-16 mb-16 md:pt-24 lg:p-16 lg:pt-28 lg:mb-0  ">
					<>
						{children}
						<Text variant="small" className=" mt-16 text-center text-maki-gray">
							© 2025 Makimura Soma
						</Text>
					</>
				</div>
				<GlobalNav />
			</body>
		</html>
	);
}
