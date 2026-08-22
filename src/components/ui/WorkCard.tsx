import { type Work, workThumbnailPath } from "@/lib/workMeta";
import Image from "next/image";
import Link from "next/link";
import { PlayBadge } from "./VideoEmbed";
import { PinIcon } from "./icons/PinIcon";

export function WorkCard({ work }: { work: Work }) {
	const thumbnail = workThumbnailPath(work);

	return (
		<article className=" relative max-w-96 space-y-2 p-5 bg-[var(--surface)] rounded-2xl border hover:shadow-sm transition shadow-lg ">
			<div>
				{/* サムネイルは作品ごとに元画像の縦横比がまちまちなので、枠を16:9に固定して
					object-cover で揃える。枠が可変だとカードの高さが作品ごとにばらつき、
					グリッドで並べたときに段差ができるため。 */}
				<Link
					href={`/works/${work.slug}`}
					className=" block relative aspect-video overflow-hidden rounded-md bg-neutral-200 "
				>
					{thumbnail && <Image src={thumbnail} alt={work.title} fill className=" object-cover " />}
					{/* 動画の作品は、開く前から動画だと分かるようにする */}
					{work.videoUrl && (
						<span className=" absolute inset-0 flex items-center justify-center ">
							<PlayBadge className=" w-12 h-12 " />
						</span>
					)}
				</Link>
			</div>
			{/* 一覧の先頭に来る理由が分かるように、ピン留めした作品には印を出す。
				サムネイルの絵柄はまちまちでピンが沈むので、画像の上には載せず、
				カードの角に画鋲で留めたように、白い丸（--surface）ごと外へはみ出させる。
				色はロードマップの「いま作ってる」と同じ amber。輪を太くするとピンの形が
				輪に溶けるので、輪は1pxに留めて、色はピン本体で出す */}
			{work.pinned && (
				<span className=" absolute -top-2 -left-2 grid place-items-center w-7 h-7 rounded-full border border-amber-300 bg-[var(--surface)] shadow-sm ">
					<PinIcon aria-label="ピン留め" className=" w-4 h-4 text-amber-500 " />
				</span>
			)}
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
