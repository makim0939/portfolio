import { type Work, workThumbnailPath } from "@/lib/workMeta";
import Image from "next/image";
import Link from "next/link";
import { PlayBadge } from "./VideoEmbed";

export function WorkCard({ work }: { work: Work }) {
	const thumbnail = workThumbnailPath(work);

	return (
		<article className=" max-w-96 space-y-2 p-5 bg-[var(--surface)] rounded-2xl border hover:shadow-sm transition shadow-lg ">
			<div>
				<Link href={`/works/${work.slug}`} className=" block relative ">
					{thumbnail && (
						<Image
							src={thumbnail}
							alt={work.title}
							className=" w-full rounded-md bg-neutral-200"
							width={1920}
							height={1080}
						/>
					)}
					{/* 動画の作品は、開く前から動画だと分かるようにする */}
					{work.videoUrl && (
						<span className=" absolute inset-0 flex items-center justify-center ">
							<PlayBadge className=" w-12 h-12 " />
						</span>
					)}
				</Link>
			</div>

			<h3 className="text-lg font-semibold">
				<Link href={`/works/${work.slug}`} className="hover:underline text-blue-600">
					{work.title}
				</Link>
			</h3>
			<p className=" text-xs text-neutral-500">
				<time dateTime={work.date}>{work.date}</time>
			</p>
			<div>
				{work.description && <p className="text-sm text-neutral-600">{work.description}</p>}
			</div>

			<ul className="flex gap-1 flex-wrap">
				{work.tags?.map((s) => (
					<li key={s} className="px-2 py-0.5 rounded-full border text-[11px] text-neutral-500">
						{s}
					</li>
				))}
			</ul>
		</article>
	);
}
