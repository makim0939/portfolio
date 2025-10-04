import React, { Suspense } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/shadcnui/avatar";
import { DoePermissionButton, Scene } from "@/components/3d/Scene";
import { FadeInContainer } from "@/components/ui/FadeInContainer";
import { OgpCard } from "@/components/ui/OgpCard";
import { SocialLinkIcon } from "@/components/ui/SocialLinkIcon";
import { StyledLink } from "@/components/ui/StyledLink";
import { Text } from "@/components/ui/Text";
import { WorkCard } from "@/components/ui/WorkCard";
import { socialLinks } from "@/lib/socialLinks";
import { getAllWorks } from "@/lib/works";
import { getAllArticleOgps } from "@/lib/zenn";

export default async function HomePage() {
	const ogps = await getAllArticleOgps();
	const works = await getAllWorks();
	return (
		<>
			{/* トップ */}
			<div className=" ">
				<header className="relative z-10">
					<Text variant="h1" className=" mb-4 lg:mb-8 ">
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
			<DoePermissionButton />
			<main className="lg:w-[50vw]">
				{/* プロフィール */}
				<article>
					<section className=" flex flex-col gap-6 ">
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
							{/* <li className="ml-2 text-right">
								<Text variant="p" className=" text-sm text-maki-gray ">
									<StyledLink href="">
										<u>他のリンクを見る</u>→
									</StyledLink>
								</Text>
							</li> */}
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

					{/* 成果物 */}
					<section className=" w-full my-16 lg:my-24">
						<Text variant="h2">制作物</Text>
						<FadeInContainer
							className=" 
								grid gap-6 my-8
								[grid-template-columns:repeat(auto-fill,minmax(200px,1fr))]
								sm:[grid-template-columns:repeat(auto-fill,minmax(230px,1fr))]
								lg:[grid-template-columns:repeat(auto-fill,minmax(260px,1fr))]
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

					{/* ブログ */}
					<section className=" my-16 lg:my-24">
						<Text variant="h2">ブログ</Text>
						<Suspense fallback={<div>Loading...</div>}>
							<FadeInContainer
								className=" 
								grid gap-6 my-8 
								[grid-template-columns:repeat(auto-fill,minmax(200px,1fr))]
								sm:[grid-template-columns:repeat(auto-fill,minmax(230px,1fr))]
								lg:[grid-template-columns:repeat(auto-fill,minmax(260px,1fr))]
							"
							>
								{ogps.map((ogp, index) => index < 3 && <OgpCard key={ogp.url} ogp={ogp} />)}
							</FadeInContainer>
						</Suspense>
						<Text variant="p" className=" text-sm text-maki-gray text-right ">
							<StyledLink href="/blog">
								<u>全てのブログを見る</u>→
							</StyledLink>
						</Text>
					</section>

					{/* コンタクト */}
					<section className=" my-16 lg:my-24 ">
						<Text variant="h2">コンタクト</Text>
						<Text className=" my-2 ">メールもしくは各種SNSのDMからご連絡ください。</Text>
					</section>

					{/* むすび */}
					<section className=" my-16 lg:my-24 ">
						<Text>
							最後までご覧いただきまして、
							<br />
							ありがとうございます。
						</Text>
					</section>
				</article>
				<Text variant="small" className=" text-center text-maki-gray">
					© 2025 Makimura Soma
				</Text>
			</main>
		</>
	);
}
