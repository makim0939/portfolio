import { WorkCard } from "@/components/ui/WorkCard";
import { getAllWorks, getWorkBySlug } from "@/lib/works";

export async function generateMetadata({
	params,
}: { params: { slug: string } }) {
	const work = await getWorkBySlug(params.slug);
	if (!work) return {};
	return {
		title: `${work.title} – Works`,
		description: work.description ?? "制作物の詳細",
	};
}

export default async function WorksPage() {
	const works = await getAllWorks();
	return (
		<main className="">
			<header>
				<h1 className="text-3xl font-bold ">制作物</h1>
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
