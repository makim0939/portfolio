import { FadeInContainer } from "@/components/ui/FadeInContainer";
import { MDXContent } from "@/components/ui/MdxContent";
import { Text } from "@/components/ui/Text";
import { VideoEmbed } from "@/components/ui/VideoEmbed";
import { WorkCover } from "@/components/ui/WorkCover";
import { AUTHOR_NAME, SITE_URL, canonicalUrl } from "@/lib/site";
import { WORK_CATEGORIES, type Work, workCoverPath, workThumbnailPath } from "@/lib/workMeta";
import { getAllWorks, getWorkBySlug } from "@/lib/works";
import { youtubeVideoId } from "@/lib/youtube";
import { notFound } from "next/navigation";

export async function generateStaticParams() {
	const works = await getAllWorks();
	return works.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
	const { slug } = await params;
	const work = await getWorkBySlug(slug);
	if (!work) return {};

	const description = work.description ?? "制作物";
	const thumbnail = workThumbnailPath(work);

	return {
		title: work.title,
		description,
		// 同じ作品が複数のURLで拾われないように、どれが本物かを示しておく
		alternates: { canonical: `/works/${work.slug}` },
		authors: [{ name: AUTHOR_NAME }],
		keywords: work.tags,
		openGraph: {
			type: "article",
			title: work.title,
			description,
			url: canonicalUrl(`/works/${work.slug}`),
			publishedTime: work.date,
			authors: [AUTHOR_NAME],
			tags: work.tags,
			images: thumbnail ? [thumbnail] : undefined,
		},
		twitter: {
			card: "summary_large_image",
			title: work.title,
			description,
			images: thumbnail ? [thumbnail] : undefined,
		},
	};
}

/**
 * 作品の中身を検索エンジンに読める形で置く。
 * 見た目には出ないが、作った人・公開日・サムネイルが検索結果に使われる。
 */
function WorkJsonLd({ work }: { work: Work }) {
	return (
		// 中身は作品のfrontmatterから組み立てたものだけで、外から来た文字は混ざらない
		<script
			type="application/ld+json"
			// biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD はこの形でしか埋め込めない
			dangerouslySetInnerHTML={{ __html: JSON.stringify(workJsonLd(work)) }}
		/>
	);
}

function workJsonLd(work: Work) {
	const url = canonicalUrl(`/works/${work.slug}`);
	const thumbnail = workThumbnailPath(work);
	return {
		"@context": "https://schema.org",
		"@type": "CreativeWork",
		name: work.title,
		description: work.description,
		image: thumbnail ? canonicalUrl(thumbnail) : undefined,
		datePublished: work.date,
		creator: { "@type": "Person", name: AUTHOR_NAME, url: SITE_URL },
		mainEntityOfPage: { "@type": "WebPage", "@id": url },
		url,
		keywords: work.tags?.join(", "),
		inLanguage: "ja",
	};
}

/** 題名・日付・カテゴリ・タグ。画像の上に重ねるときは白抜きにする */
function WorkHeading({ work, onImage }: { work: Work; onImage: boolean }) {
	const textColor = onImage ? " text-neutral-50 " : "";
	return (
		<div className=" space-y-2 3xl:space-y-4 ">
			<Text variant="h1" className={textColor}>
				{work.title}
			</Text>
			{work.description && <Text className={textColor}>{work.description}</Text>}
			<div className="flex items-center gap-2">
				<Text variant="small" className={textColor}>
					<time dateTime={work.date}>{work.date}</time>
				</Text>
				<ul className="flex gap-1 flex-wrap">
					{[WORK_CATEGORIES[work.category], ...(work.tags ?? [])].map((label) => (
						<li
							key={label}
							className={` px-2 py-0.5 rounded-full border ${onImage ? " bg-black/10 " : ""} `}
						>
							<Text variant="small" className={` text-[11px] ${textColor} `}>
								{label}
							</Text>
						</li>
					))}
				</ul>
			</div>
		</div>
	);
}

export default async function WorkPage({ params }: { params: Promise<{ slug: string }> }) {
	const { slug } = await params;
	const work = await getWorkBySlug(slug);
	if (!work) return notFound();

	// YouTubeの作品は動画が主役なので、大きな画像は敷かずにプレイヤーを主役に置く
	if (work.videoUrl) {
		return (
			<main className=" lg:max-w-6xl lg:m-auto ">
				<WorkJsonLd work={work} />
				<header className=" mb-8 ">
					<WorkHeading work={work} onImage={false} />
				</header>
				<VideoEmbed
					title={work.title}
					youtubeId={youtubeVideoId(work.videoUrl)}
					thumbnail={workThumbnailPath(work)}
				/>
				<FadeInContainer className=" mt-8 ">
					<MDXContent source={work.body} />
				</FadeInContainer>
			</main>
		);
	}

	const cover = workCoverPath(work) ?? workThumbnailPath(work);

	return (
		<main>
			<WorkJsonLd work={work} />
			<header
				className=" relative -mx-8 -mt-16 mb-8 h-[50vh]
							lg:-mx-16 lg:-mt-28 lg:mb-16 lg:w-[100vw] lg:h-[100vh]
							3xl:-mx-20 "
			>
				{cover && <WorkCover src={cover} title={work.title} />}

				<div
					className=" absolute px-8 top-1/2 -translate-y-1/2 left-0
								lg:w-full lg:max-w-6xl lg:px-0 lg:left-1/2 lg:-translate-x-1/2 "
				>
					<WorkHeading work={work} onImage={true} />
				</div>
			</header>
			<FadeInContainer className=" lg:max-w-6xl lg:min-h-[100vh] lg:m-auto ">
				<MDXContent source={work.body} />
			</FadeInContainer>
		</main>
	);
}
