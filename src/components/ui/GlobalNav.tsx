import { GlobalNavItem } from "./GlobalNavItem";
import { Text } from "./Text";
import { AboutIcon } from "./icons/AboutIcon";
import { BlogIcon } from "./icons/BlogIcon";
import { HomeIcon } from "./icons/HomeIcon";
import { MusicIcon } from "./icons/MusicIcon";
import { WorksIcon } from "./icons/WorksIcon";

export function GlobalNav() {
	// すりガラスの地色は白ではなく背景色そのものを薄めて使う。白固定にすると、
	// 時間帯で背景色が色づいたときにナビだけ白く浮いてしまうため。
	//
	// 境目はグレーのボーダーではなく影で出す。ボーダーだと背景が色づいたときに
	// 線だけ無彩色で浮くが、影なら地の色に関係なく馴染む。
	// モバイルは画面下、md以上は画面上に出るので、影の向きも入れ替える。
	return (
		<nav className=" w-screen h-fit fixed bottom-0 md:top-0 z-10 bg-[var(--background)]/60 backdrop-blur-sm shadow-[0_-1px_6px_rgba(0,0,0,0.07)] md:shadow-[0_1px_6px_rgba(0,0,0,0.07)] ">
			{/* 項目が5つになると、狭い画面では「プロフィール」が折り返してナビの高さが揃わなくなる。
				文字を少し詰めて、折り返さずに横並びを保つ。 */}
			<ul className=" flex justify-around pt-1 md:pt-2 pb-1 [&>li]:w-full [&>li]:md:w-28 [&_small]:text-[11px] [&_small]:md:text-sm [&_small]:whitespace-nowrap">
				<li>
					<GlobalNavItem href={"/"}>
						<HomeIcon />
						<Text variant="small">ホーム</Text>
					</GlobalNavItem>
				</li>
				<li>
					<GlobalNavItem href={"/about"}>
						<AboutIcon />
						<Text variant="small">プロフィール</Text>
					</GlobalNavItem>
				</li>
				<li>
					<GlobalNavItem href={"/works"}>
						<WorksIcon />
						<Text variant="small">制作物</Text>
					</GlobalNavItem>
				</li>
				<li>
					<GlobalNavItem href={"/blog"}>
						<BlogIcon />
						<Text variant="small">ブログ</Text>
					</GlobalNavItem>
				</li>
				<li>
					<GlobalNavItem href={"/music"}>
						<MusicIcon />
						<Text variant="small">演奏</Text>
					</GlobalNavItem>
				</li>
			</ul>
		</nav>
	);
}
