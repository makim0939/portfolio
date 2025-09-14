import Text from "@/components/ui/Text";
import { WorkCard } from "@/components/ui/WorkCard";
import { getAllWorks } from "@/lib/works";

export default async function WorksPage() {
	const works = await getAllWorks();
	return (
		<main className="">
			<header>
				<Text variant="h1">制作物</Text>
			</header>
			<hr className="my-8" />
			<div
				className=" 
                    grid gap-4
                    [grid-template-columns:repeat(auto-fill,minmax(220px,1fr))]
                    sm:[grid-template-columns:repeat(auto-fill,minmax(240px,1fr))]
                    lg:[grid-template-columns:repeat(auto-fill,minmax(260px,1fr))]
                "
			>
				{works.map((w) => (
					<WorkCard key={w.slug} work={w} />
				))}
			</div>
		</main>
	);
}
