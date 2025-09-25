import type { Work } from "@/lib/works";
import Image from "next/image";
import Link from "next/link";

export function WorkCard({ work }: { work: Work }) {
	return (
		<article className=" max-w-96 space-y-2 rounded-2xl border p-5 hover:shadow-sm transition shadow-xl">
			<div>
				<Link href={`/works/${work.slug}`}>
					<Image
						src={`/works/${work.coverImage}`}
						alt={work.title}
						className=" w-full rounded-md"
						width={1920}
						height={1080}
					/>
				</Link>
			</div>

			<h3 className="text-lg font-semibold">
				<Link
					href={`/works/${work.slug}`}
					className="hover:underline text-blue-600"
				>
					{work.title}
				</Link>
			</h3>
			<div>
				{work.description && (
					<p className="text-sm text-neutral-600">{work.description}</p>
				)}
			</div>

			<div className="flex items-center gap-2 text-xs text-neutral-500">
				<time dateTime={work.date}>{work.date}</time>
				<ul className="flex gap-1 flex-wrap">
					{work.tags?.map((s) => (
						<li key={s} className="px-2 py-0.5 rounded-full border text-[11px]">
							{s}
						</li>
					))}
				</ul>
			</div>
		</article>
	);
}
