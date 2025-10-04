import { FadeInContainer } from "@/components/ui/FadeInContainer";
import { Text } from "@/components/ui/Text";
import { WorkCard } from "@/components/ui/WorkCard";
import { getAllWorks } from "@/lib/works";

export default async function WorksPage() {
	const works = await getAllWorks();
	return (
		<main className=" lg:max-w-6xl lg:m-auto ">
			<header>
				<Text variant="h1">制作物</Text>
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
					{works.map((w) => (
						<WorkCard key={w.slug} work={w} />
					))}
				</div>
			</FadeInContainer>
		</main>
	);
}
