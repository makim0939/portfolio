import { FadeInContainer } from "@/components/ui/FadeInContainer";
import { MDXContent } from "@/components/ui/MdxContent";
import { Text } from "@/components/ui/Text";
import { VideoEmbed } from "@/components/ui/VideoEmbed";
import {
	getAllPerformances,
	getPerformanceBySlug,
	performanceThumbnail,
	performanceVideoPath,
	youtubeVideoId,
} from "@/lib/music";
import { notFound } from "next/navigation";

export async function generateStaticParams() {
	const performances = await getAllPerformances();
	return performances.map((performance) => ({ slug: performance.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
	const { slug } = await params;
	const performance = await getPerformanceBySlug(slug);
	if (!performance) return {};

	const description = performance.description ?? "演奏";
	const thumbnail = performanceThumbnail(performance);

	return {
		title: `${performance.title} – 演奏`,
		description,
		openGraph: {
			type: "video.other",
			title: performance.title,
			description,
			images: thumbnail ? [thumbnail] : undefined,
		},
		twitter: {
			card: "summary_large_image",
			title: performance.title,
			description,
			images: thumbnail ? [thumbnail] : undefined,
		},
	};
}

export default async function PerformancePage({ params }: { params: Promise<{ slug: string }> }) {
	const { slug } = await params;
	const performance = await getPerformanceBySlug(slug);
	if (!performance) return notFound();

	return (
		<main className=" lg:max-w-6xl lg:m-auto ">
			<header className=" space-y-2 mb-8 ">
				<Text variant="h1">{performance.title}</Text>
				<div className=" flex items-center gap-2 ">
					<Text variant="small">
						<time dateTime={performance.date}>{performance.date}</time>
					</Text>
					<ul className="flex gap-1 flex-wrap">
						{[performance.instrument, ...(performance.tags ?? [])]
							.filter((label) => label !== undefined)
							.map((label) => (
								<li key={label} className=" px-2 py-0.5 rounded-full border ">
									<Text variant="small" className=" text-[11px] ">
										{label}
									</Text>
								</li>
							))}
					</ul>
				</div>
			</header>

			<VideoEmbed
				title={performance.title}
				youtubeId={performance.videoUrl ? youtubeVideoId(performance.videoUrl) : undefined}
				videoSrc={performanceVideoPath(performance)}
				thumbnail={performanceThumbnail(performance)}
			/>

			{performance.description && <Text className=" mt-8 ">{performance.description}</Text>}

			<FadeInContainer className=" mt-8 ">
				<MDXContent source={performance.body} />
			</FadeInContainer>
		</main>
	);
}
