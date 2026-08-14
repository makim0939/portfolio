import { FadeInContainer } from "@/components/ui/FadeInContainer";
import { MusicCard } from "@/components/ui/MusicCard";
import { Text } from "@/components/ui/Text";
import { getAllPerformances } from "@/lib/music";

export const metadata = {
	title: "演奏 – まきむらのポートフォリオ",
	description: "ピアノやギターの演奏です。",
};

export default async function MusicPage() {
	const performances = await getAllPerformances();
	return (
		<main className=" min-h-[75vh] lg:max-w-6xl lg:m-auto ">
			<header>
				<Text variant="h1">演奏</Text>
			</header>
			<hr className="my-8" />
			<FadeInContainer>
				<div
					className="
						grid gap-4 md:gap-8
						sm:[grid-template-columns:repeat(auto-fill,minmax(220px,1fr))]
						md:[grid-template-columns:repeat(auto-fill,minmax(240px,1fr))]
						lg:[grid-template-columns:repeat(auto-fill,minmax(280px,1fr))]
					"
				>
					{performances.map((performance) => (
						<MusicCard key={performance.slug} performance={performance} />
					))}
				</div>
			</FadeInContainer>
		</main>
	);
}
