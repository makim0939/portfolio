import { Scene } from "@/components/3d/Scene";
import { BlogCard } from "@/components/ui/BlogCard";
import { FadeInContainer } from "@/components/ui/FadeInContainer";
import { RoadmapCard } from "@/components/ui/RoadmapCard";
import { SocialLinkIcon } from "@/components/ui/SocialLinkIcon";
import { StyledLink } from "@/components/ui/StyledLink";
import { Text } from "@/components/ui/Text";
import { WorkCard } from "@/components/ui/WorkCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/shadcnui/avatar";
import { getBlogEntries } from "@/lib/blog";
import { filterByStatus, getRoadmapItems } from "@/lib/roadmap";
import { SCENE_GLBS } from "@/lib/sceneAssets";
import { AUTHOR_NAME, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import { socialLinks } from "@/lib/socialLinks";
import { getAllWorks } from "@/lib/works";
import React, { Suspense } from "react";
// react-dom はサーバ側の条件だと既定の書き出しを持たないので、名前を指定して取る
import { preload } from "react-dom";

/** トップに出すロードマップの件数 */
const ROADMAP_PREVIEW_COUNT = 3;

/**
 * サイトと作者を検索エンジンに読める形で置く。
 * 名前で探されたときに、SNSも含めて同じ人のものだと分かるようにしておく。
 */
const siteJsonLd = {
	"@context": "https://schema.org",
	"@type": "WebSite",
	name: SITE_NAME,
	description: SITE_DESCRIPTION,
	url: SITE_URL,
	inLanguage: "ja",
	author: {
		"@type": "Person",
		name: AUTHOR_NAME,
		url: SITE_URL,
		sameAs: socialLinks.map((link) => link.url),
	},
};

export default async function HomePage() {
	const blogEntries = await getBlogEntries();
	const works = await getAllWorks();
	const allRoadmapItems = await getRoadmapItems();
	// トップでは「これから」だけ見せる。できたことは制作物やロードマップ側で見てもらう。
	const roadmapItems = [
		...filterByStatus(allRoadmapItems, "wip"),
		...filterByStatus(allRoadmapItems, "todo"),
	].slice(0, ROADMAP_PREVIEW_COUNT);

	/*
		部屋とアバターの glb を、HTML を読んだ時点で取りに行かせる。client のコードが
		動き出してから取りに行くと、その手前の JavaScript を待つぶんまるごと出遅れる。

		crossOrigin は three の読み込み方（credentials: same-origin）に合わせてある。
		食い違うと先読みしたものが使われず、同じものを二度落とすことになる。
		<link> を書くのではなく preload を呼ぶのは、JSX で書くと React が head へ持ち上げた
		ぶんと合わせて同じタグが二重に出るため。
	*/
	for (const href of SCENE_GLBS) {
		preload(href, { as: "fetch", crossOrigin: "anonymous" });
	}

	return (
		<>
			{/* 中身は自分たちで組み立てた値だけで、外から来た文字は混ざらない */}
			<script
				type="application/ld+json"
				// biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD はこの形でしか埋め込めない
				dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }}
			/>
			{/* トップ */}
			<div>
				<header className="relative z-10 lg:mb-24 ">
					<Text variant="h1" className=" mb-4 lg:mb-8 md:text-5xl xl:text-[54px] 3xl:text-6xl">
						まきむら<span className=" text-lg lg:text-4xl">の</span>
						<br />
						ポートフォリオ
					</Text>
					<Text>
						<span className=" text-lg lg:text-3xl tracking-[.21em] ">
							こんにちは。まきむらです！
						</span>
					</Text>
				</header>
				<Scene />
			</div>
			<main className="lg:w-[40vw] lg:pr-16 ">
				{/* プロフィール */}
				<article>
					<section className=" flex flex-col gap-6 my-4 lg:my-16 ">
						<hgroup className=" flex items-center ">
							<Avatar className=" mr-2 w-16 h-16 border-2 box-content border-neutral-300 ">
								<AvatarImage src="/AvatarIcon.jpg" />
								<AvatarFallback>
									<b>M</b>
								</AvatarFallback>
							</Avatar>
							<div>
								<Text variant="h2">まきむら</Text>
								<Text variant="small" className=" ml-0.5 ">
									ソフトウェアとCGのクリエイター
								</Text>
							</div>
						</hgroup>
						<ul className=" flex items-center gap-2 lg:gap-4 ">
							{socialLinks.map((socialLink) => (
								<li key={socialLink.name}>
									<SocialLinkIcon
										socialLinkData={socialLink}
										svgAttr={{ fill: "#757578", width: 28, height: 28 }}
									/>
								</li>
							))}
						</ul>
						<FadeInContainer>
							<div className=" [&>*]:mb-6 ">
								<Text>このサイトを訪れていただきまして、ありがとうございます。</Text>
								<Text>
									クリエイティブなことが楽しくて、Web・CG・音楽などをしています。 詳しくは、
									<StyledLink href="/works">
										<u>制作物</u>
									</StyledLink>
									をご覧ください。
								</Text>
								<Text>
									自分の中でぶれない軸を置くような
									創作活動の拠点となる場が欲しくて、このサイトを作りました。
								</Text>
								<Text>
									私のこと、このサイトのこと、その他なんでもDM・メールから気軽に話かけてください。
								</Text>
								<Text variant="p" className=" text-sm text-maki-gray text-right ">
									<StyledLink href="/about">
										<u>私について詳しく見る</u>→
									</StyledLink>
								</Text>
							</div>
						</FadeInContainer>
					</section>

					<section className=" w-full my-16">
						<Text variant="h2">制作物</Text>
						<FadeInContainer
							className=" 
								grid gap-6 mt-8 mb-4
								[grid-template-columns:repeat(auto-fill,minmax(200px,1fr))]
								sm:[grid-template-columns:repeat(auto-fill,minmax(220px,1fr))]
								md:[grid-template-columns:repeat(auto-fill,minmax(240px,1fr))]
								lg:[grid-template-columns:repeat(auto-fill,minmax(280px,1fr))]
							"
						>
							{works.map((w, i) => i < 3 && <WorkCard key={w.slug} work={w} />)}
						</FadeInContainer>
						<Text variant="p" className=" text-sm text-maki-gray text-right ">
							<StyledLink href="/works">
								<u>全ての制作物を見る</u>→
							</StyledLink>
						</Text>
					</section>

					<section className=" my-16">
						<Text variant="h2">ブログ</Text>
						<Suspense fallback={<div>Loading...</div>}>
							<FadeInContainer
								className=" 
								grid gap-6 mt-8 mb-4
								[grid-template-columns:repeat(auto-fill,minmax(200px,1fr))]
								sm:[grid-template-columns:repeat(auto-fill,minmax(220px,1fr))]
								md:[grid-template-columns:repeat(auto-fill,minmax(240px,1fr))]
								lg:[grid-template-columns:repeat(auto-fill,minmax(280px,1fr))]
							"
							>
								{blogEntries.map(
									(entry, index) => index < 3 && <BlogCard key={entry.href} entry={entry} />,
								)}
							</FadeInContainer>
						</Suspense>
						<Text variant="p" className=" text-sm text-maki-gray text-right ">
							<StyledLink href="/blog">
								<u>全てのブログを見る</u>→
							</StyledLink>
						</Text>
					</section>

					{roadmapItems.length > 0 && (
						<section className=" my-16 ">
							<Text variant="h2">ロードマップ</Text>
							<Text variant="small" className=" mt-2 ">
								このサイトにこれから盛り込みたいことです。
							</Text>
							<FadeInContainer
								className="
									grid gap-6 mt-8 mb-4 items-stretch
									[grid-template-columns:repeat(auto-fill,minmax(200px,1fr))]
									sm:[grid-template-columns:repeat(auto-fill,minmax(220px,1fr))]
									md:[grid-template-columns:repeat(auto-fill,minmax(240px,1fr))]
									lg:[grid-template-columns:repeat(auto-fill,minmax(280px,1fr))]
									[&>div]:h-full
								"
							>
								{roadmapItems.map((item) => (
									<RoadmapCard key={item.number} item={item} />
								))}
							</FadeInContainer>
							<Text variant="p" className=" text-sm text-maki-gray text-right ">
								<StyledLink href="/roadmap">
									<u>ロードマップを見る</u>→
								</StyledLink>
							</Text>
						</section>
					)}

					<section className=" my-16 ">
						<Text variant="h2" className="mt-8 mb-4">
							コンタクト
						</Text>
						<Text className=" my-2 ">メールもしくは各種SNSのDMからご連絡ください。</Text>
					</section>

					{/* むすび */}
					<section className=" my-16 ">
						<Text>
							最後までご覧いただきまして、
							<br />
							ありがとうございます。
						</Text>
					</section>
				</article>
			</main>
		</>
	);
}
