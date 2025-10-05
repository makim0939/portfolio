import { Suspense } from "react";
import { OgpCard } from "@/components/ui/OgpCard";
import { Text } from "@/components/ui/Text";
import { getAllArticleOgps } from "@/lib/zenn";

export default async function BlogPage() {
	const ogps = await getAllArticleOgps();
	return (
		<main className=" lg:max-w-6xl lg:m-auto ">
			<header>
				<Text variant="h1">ブログ</Text>
			</header>
			<hr className="my-8" />
			<div
				className=" 
                    grid gap-4 md:gap-8
                    sm:[grid-template-columns:repeat(auto-fill,minmax(220px,1fr))]
					md:[grid-template-columns:repeat(auto-fill,minmax(240px,1fr))]
					lg:[grid-template-columns:repeat(auto-fill,minmax(280px,1fr))]
                "
			>
				<Suspense fallback={<div>Loading...</div>}>
					{ogps.map((o) => (
						<OgpCard key={o.url} ogp={o} />
					))}
				</Suspense>
			</div>
		</main>
	);
}
