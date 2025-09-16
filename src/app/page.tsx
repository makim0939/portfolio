import Scene from "@/components/3d/Scene";
import { Card, CardContents, CardCover } from "@/components/ui/Card";
import OgpCard from "@/components/ui/OgpCard";
import SocialLinkIcon from "@/components/ui/SocialLinkIcon";
import StyledLink from "@/components/ui/StyledLink";
import Text from "@/components/ui/Text";
import { WorkCard } from "@/components/ui/WorkCard";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@/components/ui/shadcnui/avatar";
import { socialLinks } from "@/lib/socialLinks";
import { getAllWorks } from "@/lib/works";
import { getAllArticleOgps } from "@/lib/zenn";
import React, { Suspense } from "react";

export default async function HomePage() {
	const ogps = await getAllArticleOgps();
	const works = await getAllWorks();
	return (
		<>
			{/* トップ */}
			<div>
				<header className=" absolute z-10 md:relative">
					<Text variant="h1" className=" mb-4 md:mb-8 ">
						まきむら<span className=" text-lg md:text-4xl">の</span>
						<br />
						ポートフォリオ
					</Text>
					<Text>
						<span className=" text-lg md:text-3xl tracking-[.21em] ">
							こんにちは。まきむらです！
						</span>
					</Text>
				</header>
				<Scene />
			</div>
			<main>
				{/* プロフィール */}
				<article>
					<section className=" flex flex-col gap-6">
						<hgroup className=" flex ">
							<Avatar className=" mr-2 w-14 h-14">
								<AvatarImage src="https://github.com/shadcn.png" />
								<AvatarFallback>
									<b>M</b>
								</AvatarFallback>
							</Avatar>
							<div>
								<Text variant="h2">まきむら</Text>
								<Text variant="small" className=" ml-1.5">
									ソフトウェアとCGのクリエイター
								</Text>
							</div>
						</hgroup>
						<ul className=" flex items-center gap-2 md:gap-4 ">
							{socialLinks.map((socialLink) => (
								<li key={socialLink.name}>
									<SocialLinkIcon
										socialLinkData={socialLink}
										svgAttr={{ fill: "#757578", width: 28, height: 28 }}
									/>
								</li>
							))}
							<li className="ml-2 text-right">
								<Text variant="small" className="">
									<StyledLink href="">
										<u>他のリンクを見る</u>→
									</StyledLink>
								</Text>
							</li>
						</ul>
						<Text>
							このサイトを訪れていただきまして、ありがとうございます。
							<br />
							Web開発、CG制作などクリエイティブな活動をしています。詳しくは、
							<StyledLink href="">
								<u>制作物</u>
							</StyledLink>
							をご覧ください。
							<br />
							お仕事としての実績をつむため、Web制作などのご依頼を安価に引きけております。
							<br />
							チャット、メール、DMからお気軽にご連絡ください。
						</Text>
					</section>

					{/* 成果物 */}
					<section className=" flex flex-col gap-6 my-16 md:my-24">
						<Text variant="h2">制作物</Text>
						{works.map((w, i) => i < 3 && <WorkCard key={w.slug} work={w} />)}
						<Text variant="small" className=" w-full text-right">
							<StyledLink href="/works">
								<u>全ての制作物を見る</u>→
							</StyledLink>
						</Text>
					</section>

					{/* ブログ */}
					<section className=" flex flex-col gap-6 my-16 md:my-24">
						<Text variant="h2">ブログ</Text>
						<Suspense fallback={<div>Loading...</div>}>
							{ogps.map(
								(ogp, index) => index < 3 && <OgpCard key={ogp.url} {...ogp} />,
							)}
						</Suspense>
						<Text variant="small" className=" w-full text-right">
							<StyledLink href="/blog">
								<u>全てのブログを見る</u>→
							</StyledLink>
						</Text>
					</section>

					{/* コンタクト */}
					<section className=" my-16 md:my-24 ">
						<Text variant="h2">コンタクト</Text>
					</section>

					{/* むすび */}
					<section className=" my-16 md:my-24 ">
						<Text>
							最後までご覧いただきまして、
							<br />
							ありがとうございます。
						</Text>
						<Text variant="small" className=" text-center text-maki-gray">
							© 2025 Soma Makimura
						</Text>
					</section>
				</article>
			</main>
		</>
	);
}
