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
				<div className=" p-8 md:p-16 pt-16 md:pt-24 mb-16 ">{children}</div>
				<GlobalNav />
			</body>
		</html>
	);
}
