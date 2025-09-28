import { MDXContent } from "@/components/ui/MdxContent";
import Text from "@/components/ui/Text";
import { getAllWorks, getWorkBySlug } from "@/lib/works";
import Image from "next/image";
import { notFound } from "next/navigation";

export async function generateStaticParams() {
	const works = await getAllWorks();
	return works.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
	const { slug } = await params;
	const work = await getWorkBySlug(slug);
	if (!work) return {};
	return {
		title: `${work.title} – Blog`,
		description: work.description ?? "ブログ記事",
	};
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
	const { slug } = await params;
	const work = await getWorkBySlug(slug);
	if (!work) return notFound();
	return (
		<main>
			<header className=" relative -m-8 md:-m-16 -mt-16 md:-mt-24 mb-8 h-[50vh] ">
				<Image
					src={`/works/${work.coverImage}`}
					width={1920}
					height={1080}
					alt={work.title}
					className=" absolute w-full h-full object-cover  brightness-50"
				/>
				<div className=" absolute top-1/2 left-8 -translate-y-1/2 text-neutral-50 ">
					<Text variant="h1" className="text-neutral-50">
						{work.title}
					</Text>
					{work.description && <Text className="text-neutral-50">{work.description}</Text>}
					<Text variant="small" className="text-neutral-50">
						<time dateTime={work.date}>{work.date}</time>
						{work.tags?.length ? ` ・ ${work.tags.join(", ")}` : null}
					</Text>
				</div>
			</header>
			<MDXContent source={work.body} />
		</main>
	);
}
