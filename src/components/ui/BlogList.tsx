"use client";

import type { BlogEntry } from "@/lib/blog";
import { BLOG_CATEGORIES } from "@/lib/blogCategories";
import { useState } from "react";
import { BlogCard } from "./BlogCard";
import { ALL_CATEGORIES, CategoryTabs } from "./CategoryTabs";
import { FadeInContainer } from "./FadeInContainer";

export function BlogList({ entries }: { entries: BlogEntry[] }) {
	const [category, setCategory] = useState<string>(ALL_CATEGORIES);

	const shown =
		category === ALL_CATEGORIES ? entries : entries.filter((entry) => entry.category === category);

	return (
		<div className=" space-y-8 ">
			<CategoryTabs
				labels={BLOG_CATEGORIES}
				available={entries.map((entry) => entry.category)}
				value={category}
				onChange={setCategory}
			/>

			{/* 絞り込むと並ぶカードが変わる。key を変えて作り直させないと、
				新しく現れたカードが表示の監視対象にならず出てこない。 */}
			<FadeInContainer
				key={category}
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
			</FadeInContainer>
		</div>
	);
}
