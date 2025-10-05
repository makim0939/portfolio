import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import { GlobalNav } from "@/components/ui/GlobalNav";
import { Text } from "@/components/ui/Text";
import "./globals.css";

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
