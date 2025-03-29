import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

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
			<body className={inter.className}>
				<nav className="bg-gray-100 p-4">
					<div className="container mx-auto flex gap-4">
						<Link href="/" className="hover:text-gray-600">
							Home
						</Link>
						<Link href="/about" className="hover:text-gray-600">
							About
						</Link>
					</div>
				</nav>
				{children}
			</body>
		</html>
	);
}
