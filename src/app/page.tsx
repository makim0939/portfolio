import Text from "@/components/ui/Text";
import Link from "next/link";
import Scene from "../components/3d/Scene";

export default function Home() {
	return (
		<div className="flex flex-col w-full h-full">
			<div className="px-8 pt-16 md:w-2xl md:p-16">
				<header className=" md:mb-12 [&>p]:ml-1 [&>p]:md:ml-1.5">
					<Text variant="h1" className=" my-4">
						まきむら<span className=" text-lg md:text-4xl">の</span>
						<br />
						ポートフォリオ
					</Text>
					<Text>
						<span className=" md:text-3xl tracking-[.21em]">
							こんにちは。まきむらです！
						</span>
					</Text>
				</header>
				<main>
					<section>
						<Text>
							<br />
							このサイトは現在制作中です。
							<br />
							5月末までに、初期リリース版を公開予定です。
							<br />
							<a
								href="https://makimura-portfolio.com"
								className="text-blue-500  "
							>
								<span className=" hover:underline ">
									現行のポートフォリオサイトを見る
								</span>
								→
							</a>
						</Text>
					</section>
				</main>
			</div>
			<Scene />
		</div>
	);
}
