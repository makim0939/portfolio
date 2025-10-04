import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import { GlobalNav } from "@/components/ui/GlobalNav";

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
				<div className=" p-8 lg:p-16 3xl:p-20 pt-16 lg:pt-24 mb-16 ">{children}</div>
				<GlobalNav />
			</body>
		</html>
	);
}
