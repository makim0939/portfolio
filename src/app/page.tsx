import Link from "next/link";
import Scene from "./components/Scene";

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
				<nav className=" w-full fixed bottom-0 left-0 z-10 p-4 border-t border-t-gray-200 backdrop-blur-md md:static md:p-0 md:border-none md:text-lg">
					<ul className="flex justify-around md:flex-col">
						<Link href="/" className="md:mb-8 md:text-2xl hover:text-gray-600">
							Home
						</Link>
						<Link
							href="/about"
							className="md:mb-8 md:text-2xl hover:text-gray-600"
						>
							About
						</Link>
					</ul>
				</nav>
			</section>
			<Scene />
		</div>
	);
}
