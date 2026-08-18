import { BlogList } from "@/components/ui/BlogList";
import { Text } from "@/components/ui/Text";
import { getBlogEntries } from "@/lib/blog";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "ブログ",
	description:
		"技術のこと、開発日記、暮らしのことを書いています。Zennに投稿した記事もまとめて並べています。",
	alternates: { canonical: "/blog" },
};

export default async function BlogPage() {
	const entries = await getBlogEntries();
	return (
		<main className=" min-h-[75vh] lg:max-w-6xl lg:m-auto ">
			<header>
				<Text variant="h1">ブログ</Text>
			</header>
			<hr className="my-8" />
			<BlogList entries={entries} />
		</main>
	);
}
