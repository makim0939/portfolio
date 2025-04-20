import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import GlobalNav from "@/components/ui/GlobalNav";

const notoSansJP = Noto_Sans_JP({ subsets: ["latin"] });

export const metadata: Metadata = {
	title: "まきむらのポートフォリオ",
	description: "まきむらのポートフォリオサイトです。",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="ja">
			<body className={notoSansJP.className}>
				{children}
				<GlobalNav />
			</body>
		</html>
	);
}
