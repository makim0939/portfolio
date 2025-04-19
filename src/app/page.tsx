import Text from "@/components/ui/Text";
import Link from "next/link";
import React from "react";
import { div } from "three/tsl";
import Scene from "../components/3d/Scene";

export default function Home() {
	return (
		<div className="wrapper">
			<div>
				<div className=" md:w-2xl">
					<header className="">
						<Text variant="h1" className=" mb-4">
							まきむら<span className=" text-lg md:text-4xl">の</span>
							<br />
							ポートフォリオ
						</Text>
						<Text>
							<span className=" text-lg md:text-3xl tracking-[.21em]">
								こんにちは。まきむらです！
							</span>
						</Text>
					</header>
				</div>
				<Scene />
			</div>
			<main>
				<article>
					<section>
						<Text>
							このサイトを訪れていただきまして、ありがとうございます。
							<br />
							Web開発、CG制作などクリエイティブな活動をしています。詳しくは、
							<Link href={"/about"}>
								<u>制作物</u>
							</Link>
							をご覧ください。
							<br />
							お仕事としての実績をつむため、Web制作などのご依頼を安価に引きけております。
							<br />
							チャット、メール、DMからお気軽にご連絡ください。
						</Text>
					</section>
					<section>
						<Text variant="h2">制作物</Text>
					</section>
					<section>
						<Text variant="h2">ブログ</Text>
					</section>
					<section>
						<Text variant="h2">コンタクト</Text>
					</section>
					<section>
						<Text>
							最後までご覧いただきまして、
							<br />
							ありがとうございます。
						</Text>
						<Text variant="small">©️ 2025 Soma Makimura</Text>
					</section>
				</article>
			</main>
		</div>
	);
}
