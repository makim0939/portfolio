import type { BlogEntry } from "@/lib/blog";
import { BLOG_CATEGORIES } from "@/lib/blogCategories";
import Image from "next/image";
import Link from "next/link";
import FavoriteFillIcon from "./icons/FavoriteFillIcon";

export function BlogCard({ entry }: { entry: BlogEntry }) {
	// サイト外の記事はタブを奪わずに開く。同一サイト内の記事は通常の遷移でよい。
	const linkProps = entry.isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {};

	return (
		<article className=" min-w-44 max-w-96 p-5 space-y-2 bg-[var(--surface)] rounded-2xl border hover:shadow-sm transition shadow-lg ">
			<div>
				<Link href={entry.href} {...linkProps}>
					<Image
						src={entry.image}
						alt={entry.title}
						className=" w-full rounded-md bg-neutral-200"
						width={1200}
						height={630}
					/>
				</Link>
			</div>

			<h3 className="text-base font-semibold">
				<Link href={entry.href} {...linkProps} className="hover:underline text-blue-600">
					{entry.emoji && `${entry.emoji} `} {entry.title}
				</Link>
			</h3>
			<div>
				{entry.description && <p className="text-sm text-neutral-600">{entry.description}</p>}
			</div>

			<div className="flex items-center gap-2 text-sm text-neutral-500">
				<time dateTime={entry.date}>{entry.date}</time>
				<span className="px-2 py-0.5 rounded-full border text-[11px]">
					{BLOG_CATEGORIES[entry.category]}
				</span>
				{/* いいね数はZennから取れたときだけ出す */}
				{entry.likedCount !== undefined && (
					<div>
						<FavoriteFillIcon
							className=" inline align-middle "
							width={20}
							height={20}
							fill="#dd5522"
						/>
						<p className=" inline align-middle text-sm text-neutral-500">{entry.likedCount}</p>
					</div>
				)}
			</div>
		</article>
	);
}
