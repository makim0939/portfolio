"use client";

import type { BlogEntry } from "@/lib/blog";
import { BLOG_CATEGORIES, type BlogCategory } from "@/lib/blogCategories";
import { useState } from "react";
import { BlogCard } from "./BlogCard";

type Filter = BlogCategory | "all";

export function BlogList({ entries }: { entries: BlogEntry[] }) {
	const [filter, setFilter] = useState<Filter>("all");

	// 記事が1本もないカテゴリのタブを出すと、押しても何も起きないタブになってしまう
	const usedCategories = (Object.keys(BLOG_CATEGORIES) as BlogCategory[]).filter((category) =>
		entries.some((entry) => entry.category === category),
	);
	const filters: Filter[] = ["all", ...usedCategories];

	const shown = filter === "all" ? entries : entries.filter((entry) => entry.category === filter);

	return (
		<div className=" space-y-8 ">
			<ul className=" flex flex-wrap gap-2 ">
				{filters.map((value) => (
					<li key={value}>
						<button
							type="button"
							onClick={() => setFilter(value)}
							aria-pressed={filter === value}
							className={` px-4 py-1.5 rounded-full border text-sm transition
								${
									filter === value
										? " bg-maki-black text-neutral-50 border-maki-black "
										: " bg-[var(--surface)] text-maki-gray hover:shadow-sm "
								} `}
						>
							{value === "all" ? "すべて" : BLOG_CATEGORIES[value]}
						</button>
					</li>
				))}
			</ul>

			<div
				className="
					grid gap-4 md:gap-8
					sm:[grid-template-columns:repeat(auto-fill,minmax(220px,1fr))]
					md:[grid-template-columns:repeat(auto-fill,minmax(240px,1fr))]
					lg:[grid-template-columns:repeat(auto-fill,minmax(280px,1fr))]
				"
			>
				{shown.map((entry) => (
					<BlogCard key={entry.href} entry={entry} />
				))}
			</div>
		</div>
	);
}
