"use client";

import { WORK_CATEGORIES, type Work } from "@/lib/workMeta";
import { useState } from "react";
import { ALL_CATEGORIES, CategoryTabs } from "./CategoryTabs";
import { FadeInContainer } from "./FadeInContainer";
import { WorkCard } from "./WorkCard";

export function WorksList({ works }: { works: Work[] }) {
	const [category, setCategory] = useState<string>(ALL_CATEGORIES);

	const shown =
		category === ALL_CATEGORIES ? works : works.filter((work) => work.category === category);

	return (
		<div className=" space-y-8 ">
			<CategoryTabs
				labels={WORK_CATEGORIES}
				available={works.map((work) => work.category)}
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
				{shown.map((work) => (
					<WorkCard key={work.slug} work={work} />
				))}
			</FadeInContainer>
		</div>
	);
}
