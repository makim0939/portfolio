import { type Work, workThumbnailPath } from "@/lib/workMeta";
import Image from "next/image";
import Link from "next/link";
import { AudioBadge } from "./AudioPlayer";
import { PlayBadge } from "./VideoEmbed";
import { PinIcon } from "./icons/PinIcon";

export function WorkCard({ work }: { work: Work }) {
	const thumbnail = workThumbnailPath(work);

	return (
		// 題名や説明文の行数は作品ごとに違うので、縦に伸び縮みする余白をどこかに持たせないと
		// タグの位置が隣のカードとずれて段差になる。行数ぶんの高さを上で決め打ちすると
		// 短い作品の題名の下に穴が空くので、余りは下端に寄せる（タグの mt-auto）。
		// h-full は FadeInContainer が挟む div ぶん。これがないと article が行の高さまで伸びない
		<article className=" relative flex flex-col h-full max-w-96 space-y-2 p-5 bg-[var(--surface)] rounded-2xl border hover:shadow-sm transition shadow-lg ">
			<div>
				{/* サムネイルは作品ごとに元画像の縦横比がまちまちなので、枠を16:9に固定して
					object-cover で揃える。枠が可変だとカードの高さが作品ごとにばらつき、
					グリッドで並べたときに段差ができるため。 */}
				<Link
					href={`/works/${work.slug}`}
					className=" block relative aspect-video overflow-hidden rounded-md bg-neutral-200 "
				>
					{thumbnail && <Image src={thumbnail} alt={work.title} fill className=" object-cover " />}
					{/* 動画・音源の作品は、開く前から動画・音だと分かるようにする */}
					{(work.videoUrl || work.audioUrl) && (
						<span className=" absolute inset-0 flex items-center justify-center ">
							{work.videoUrl ? (
								<PlayBadge className=" w-12 h-12 " />
							) : (
								<AudioBadge className=" w-12 h-12 " />
							)}
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
			{/* line-clamp は高さを確保するためではなく、長い題名が3行以上に伸びて
				カードが間延びするのを防ぐ上限。1列で並ぶ幅では切らずに全文を出す */}
			<h3 className="text-lg font-semibold sm:line-clamp-2">
				<Link href={`/works/${work.slug}`} className="hover:underline text-blue-600">
					{work.title}
				</Link>
			</h3>
			<p className=" text-xs text-neutral-500">
				<time dateTime={work.date}>{work.date}</time>
			</p>
			<div>
				{work.description && (
					<p className="text-sm text-neutral-600 sm:line-clamp-2">{work.description}</p>
				)}
			</div>

			{/* 余った高さをここから上に押し上げて、タグをカードの下端に揃える */}
			<ul className="flex gap-1 flex-wrap mt-auto">
				{work.tags?.map((s) => (
					<li key={s} className="px-2 py-0.5 rounded-full border text-[11px] text-neutral-500">
						{s}
					</li>
				))}
			</ul>
		</article>
	);
}
