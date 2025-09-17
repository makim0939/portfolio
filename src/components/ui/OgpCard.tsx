// components/OgpCard.tsx
import Image from "next/image";
import type { OgpData } from "@/lib/zenn";
import Link from "next/link";
import FavoriteFillIcon from "./icons/FavoriteFillIcon";

export default function OgpCard({
	title,
	description,
	image,
	url,
	lastUpdate,
	likedCount,
}: OgpData) {
	return (
		<article className=" max-w-96 space-y-2 rounded-2xl border p-5 hover:shadow-sm transition shadow-xl">
			<div>
				<Link href={url} target="_blank" rel="noopener noreferrer">
					<Image
						src={image}
						alt={title}
						className=" w-full rounded-md"
						width={1200}
						height={630}
					/>
				</Link>
			</div>

			<h3 className="text-lg font-semibold">
				<Link
					href={url}
					target="_blank"
					rel="noopener noreferrer"
					className="hover:underline text-blue-600"
				>
					{title}
				</Link>
			</h3>
			<div>
				{description && (
					<p className="text-sm text-neutral-600">{description}</p>
				)}
			</div>

			<div className="flex items-center gap-2 text-sm text-neutral-500">
				<time dateTime={lastUpdate}>{lastUpdate}</time>
				<div className="">
					<FavoriteFillIcon
						className=" inline align-middle "
						width={20}
						height={20}
						fill="#dd5522"
					/>
					<p className=" inline align-middle text-sm text-neutral-500">
						{likedCount ?? ""}
					</p>
				</div>
				{/* <ul className="flex gap-1 flex-wrap">
					{work.tags?.map((s) => (
						<li key={s} className="px-2 py-0.5 rounded-full border text-[11px]">
							{s}
						</li>
					))}
				</ul> */}
			</div>
		</article>
	);
}
