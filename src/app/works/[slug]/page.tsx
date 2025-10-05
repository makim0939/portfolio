import Image from "next/image";
import { notFound } from "next/navigation";
import { MDXContent } from "@/components/ui/MdxContent";
import { Text } from "@/components/ui/Text";
import { getAllWorks, getWorkBySlug } from "@/lib/works";
import { FadeInContainer } from "@/components/ui/FadeInContainer";

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
	const isCoverVideo = work?.coverImage.split(".")[1] === "mp4";
	if (!work) return notFound();
	return (
		<main>
			<header
				className=" relative -mx-8 -mt-16 mb-8 h-[50vh] 
							lg:-mx-16 lg:-mt-28 lg:mb-16 lg:w-[100vw] lg:h-[100vh] 
							3xl:-mx-20 "
			>
				{isCoverVideo ? (
					<video
						src={`/works/${work.coverImage}`}
						width={1920}
						height={1080}
						muted
						autoPlay
						loop
						playsInline
						controls={false}
						className=" absolute w-full h-full object-cover brightness-50 bg-neutral-200"
					/>
				) : (
					<Image
						src={`/works/${work.coverImage}`}
						width={1920}
						height={1080}
						alt={work.title}
						className=" absolute w-full h-full object-cover  brightness-50"
					/>
				)}

				<div
					className=" absolute px-8 space-y-2 top-1/2 -translate-y-1/2 left-0 text-neutral-50
								lg:w-full lg:max-w-6xl lg:px-0 lg:left-1/2 lg:-translate-x-1/2 
								3xl:space-y-4"
				>
					<Text variant="h1" className="text-neutral-50">
						{work.title}
					</Text>
					{work.description && <Text className="text-neutral-50">{work.description}</Text>}
					{/* <Text variant="small" className="text-neutral-50">
						<time dateTime={work.date}>{work.date}</time>
						{work.tags?.length ? ` ・ ${work.tags.join(", ")}` : null}
					</Text> */}
					<div className="flex items-center gap-2 text-xs text-neutral-50">
						<Text variant="small" className="text-neutral-50 ">
							<time dateTime={work.date}>{work.date}</time>
						</Text>
						<ul className="flex gap-1 flex-wrap">
							{work.tags?.map((tag) => (
								<li key={tag} className="px-2 py-0.5 rounded-full border bg-black/10 ">
									<Text variant="small" className=" text-[11px] text-neutral-50">
										{tag}
									</Text>
								</li>
							))}
						</ul>
					</div>
				</div>
			</header>
			<FadeInContainer className=" lg:max-w-6xl lg:min-h-[100vh] lg:m-auto ">
				<MDXContent source={work.body} />
			</FadeInContainer>
		</main>
	);
}
