import { FadeInContainer } from "@/components/ui/FadeInContainer";
import { RoadmapCard } from "@/components/ui/RoadmapCard";
import { RoadmapProgress } from "@/components/ui/RoadmapProgress";
import { Text } from "@/components/ui/Text";
import { type RoadmapStatus, filterByStatus, getRoadmapItems } from "@/lib/roadmap";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "ロードマップ | まきむらのポートフォリオ",
	description: "このサイトにこれから盛り込みたい機能と、できたことの記録です。",
};

const ISSUES_URL = "https://github.com/makim0939/portfolio/issues";

const sections: { status: RoadmapStatus; heading: string; lead: string; empty: string }[] = [
	{
		status: "wip",
		heading: "いま作ってる",
		lead: "手を動かしている最中のものです。",
		empty: "いまは手が空いています。次は何を作ろう。",
	},
	{
		status: "todo",
		heading: "作りたい",
		lead: "いつか形にしたいことたち。順番は決めていません。",
		empty: "やりたいことを書き出し中です。",
	},
	{
		status: "done",
		heading: "できた",
		lead: "このサイトに入った機能です。",
		empty: "まだありません。",
	},
];

export default async function RoadmapPage() {
	const items = await getRoadmapItems();
	const doneCount = filterByStatus(items, "done").length;

	return (
		<main className=" min-h-[75vh] lg:max-w-6xl lg:m-auto ">
			<header>
				<Text variant="h1">ロードマップ</Text>
				<Text className=" mt-6 ">
					このサイトにこれから盛り込みたいことを、そのまま公開しています。
					<br />
					中身は GitHub の Issue で、カードを押すと元の Issue に飛びます。
				</Text>
				<div className=" mt-8 ">
					<RoadmapProgress done={doneCount} total={items.length} />
				</div>
			</header>
			<hr className="my-8" />

			{/* 3つの節を1本の線でつなぎ、上から下へ進んでいく道に見せる */}
			<div className=" relative ">
				<div className=" absolute left-[5px] top-3 bottom-3 border-l-2 border-dashed border-neutral-300 " />
				<ol className=" space-y-16 ">
					{sections.map((section) => {
						const sectionItems = filterByStatus(items, section.status);
						return (
							// 節ごとに直接リンクできるよう id を振る（/roadmap#todo など）
							<li id={section.status} key={section.status} className=" relative pl-8 md:pl-10 ">
								<span
									aria-hidden="true"
									className={` absolute left-0 top-2.5 w-3 h-3 rounded-full ${
										section.status === "wip"
											? "bg-amber-400"
											: section.status === "done"
												? "bg-emerald-400"
												: "bg-neutral-300"
									} `}
								/>
								<hgroup className=" mb-6 ">
									<Text variant="h2" className=" text-xl md:text-2xl ">
										{section.heading}
										<span className=" ml-3 text-sm font-normal text-maki-gray tabular-nums ">
											{sectionItems.length}
										</span>
									</Text>
									<Text variant="small" className=" mt-1 ">
										{section.lead}
									</Text>
								</hgroup>

								{sectionItems.length === 0 ? (
									<Text variant="small" className=" text-maki-gray ">
										{section.empty}
									</Text>
								) : (
									<FadeInContainer
										className="
											grid gap-4 md:gap-6 items-stretch
											[grid-template-columns:repeat(auto-fill,minmax(220px,1fr))]
											md:[grid-template-columns:repeat(auto-fill,minmax(260px,1fr))]
											lg:[grid-template-columns:repeat(auto-fill,minmax(300px,1fr))]
											[&>div]:h-full
										"
									>
										{sectionItems.map((item) => (
											<RoadmapCard key={item.number} item={item} />
										))}
									</FadeInContainer>
								)}
							</li>
						);
					})}
				</ol>
			</div>

			<Text variant="p" className=" mt-16 text-sm text-maki-gray text-left ">
				<a
					href={ISSUES_URL}
					target="_blank"
					rel="noopener noreferrer"
					className=" hover:text-blue-500 duration-100 "
				>
					←<u>Homeに戻る</u>
				</a>
			</Text>
		</main>
	);
}
