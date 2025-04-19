import Link from "next/link";
import Scene from "../components/3d/Scene";

export default function Home() {
	return (
		<div className="flex flex-col w-full h-full">
			<section className="px-8 pt-16 md:w-2xl md:p-16">
				<header className=" md:mb-12 [&>p]:ml-1 [&>p]:md:ml-1.5">
					<h1 className="mb-1 text-4xl font-bold leading-relaxed md:text-5xl ">
						まきむらは、
						<br />
						<span className=" dot-text">制作</span>中...
					</h1>
					<p>まきむらのポートフォリオサイト。</p>
				</header>
				<main>
					<section>
						<p>
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
						</p>
					</section>
				</main>
			</section>
			<Scene />
		</div>
	);
}
