import { type Performance, performanceThumbnail } from "@/lib/music";
import Image from "next/image";
import Link from "next/link";
import { PlayBadge } from "./VideoEmbed";

export function MusicCard({ performance }: { performance: Performance }) {
	const thumbnail = performanceThumbnail(performance);

	return (
		<article className=" max-w-96 space-y-2 p-5 bg-[var(--surface)] rounded-2xl border hover:shadow-sm transition shadow-lg ">
			<Link href={`/music/${performance.slug}`} className=" block ">
				<div className=" relative aspect-video rounded-md overflow-hidden bg-neutral-800 ">
					{thumbnail && (
						<Image
							src={thumbnail}
							alt={performance.title}
							width={1280}
							height={720}
							className=" absolute inset-0 w-full h-full object-cover "
						/>
					)}
					<span className=" absolute inset-0 flex items-center justify-center ">
						<PlayBadge className=" w-12 h-12 " />
					</span>
				</div>
			</Link>

			<h3 className="text-lg font-semibold">
				<Link href={`/music/${performance.slug}`} className="hover:underline text-blue-600">
					{performance.title}
				</Link>
			</h3>
			<div className=" flex items-center gap-2 text-xs text-neutral-500 ">
				<time dateTime={performance.date}>{performance.date}</time>
				{performance.instrument && (
					<span className=" px-2 py-0.5 rounded-full border text-[11px] ">
						{performance.instrument}
					</span>
				)}
			</div>
			{performance.description && (
				<p className="text-sm text-neutral-600">{performance.description}</p>
			)}
		</article>
	);
}
