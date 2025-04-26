import { Card, CardContents, CardCover } from "@/components/ui/Card";
import SNSLink from "@/components/ui/SNSLink";
import StyledLink from "@/components/ui/StyledLink";
import Text from "@/components/ui/Text";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@/components/ui/shadcnui/avatar";
import React from "react";
import Scene from "../components/3d/Scene";

export default function HomePage() {
	return (
		<>
			<div>
				<div className=" md:w-2xl">
					<header>
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
				</div>
				<Scene />
			</div>
			<main>
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
							<li>
								<SNSLink
									snsName="x"
									svgAttr={{ fill: "#757578", width: 28, height: 28 }}
								/>
							</li>
							<li>
								<SNSLink
									snsName="github"
									svgAttr={{ fill: "#757578", width: 28, height: 28 }}
								/>
							</li>
							<li>
								<SNSLink
									snsName="artstation"
									svgAttr={{ fill: "#757578", width: 28, height: 28 }}
								/>
							</li>
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

					<section className=" flex flex-col gap-6 my-16 md:my-24">
						<Text variant="h2">制作物</Text>
						<Card className="md:w-5xl ">
							<CardCover src={"/dummy_image.png"} />
							<CardContents className="md:flex flex-col gap-4">
								<Text variant="h3">
									<StyledLink
										href={""}
										className=" text-maki-black md:text-maki-black "
									>
										ポートフォリオサイト（旧）
									</StyledLink>
								</Text>
								<Text variant="p" className="flex-3/5">
									2024/02から2025/03まで運用していたWebサイトです。
									「自分を知ってもらう場」として、名刺をモチーフにデザイン
									しました。
									<br />
									背景のポイントグリッドやテキストアニメーションをはじめ、
									アニメーションにもこだわっています。
								</Text>
								<Text
									variant="small"
									className=" hidden md:block flex-1/5 w-full text-right"
								>
									<StyledLink href={"product"} className="  ">
										<u>詳しく見る</u>→
									</StyledLink>
								</Text>
							</CardContents>
						</Card>
						<Text variant="small" className=" w-full text-right">
							<StyledLink href="">
								<u>全ての制作物を見る</u>→
							</StyledLink>
						</Text>
					</section>

					<section className=" my-16 md:my-24 ">
						<Text variant="h2" className="my-6">
							ブログ
						</Text>
						<Card className="md:w-xl">
							<CardCover src={"/dummy_image.png"} />
							<CardContents className="w-full">
								<Text variant="h3">
									<StyledLink
										href={""}
										className=" text-maki-black md:text-maki-black "
									>
										ブログ記事
									</StyledLink>
								</Text>
							</CardContents>
						</Card>
					</section>

					<section className=" my-16 md:my-24 ">
						<Text variant="h2">コンタクト</Text>
					</section>

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
