import GlobalNavItem from "./GlobalNavItem";
import Text from "./Text";
import AboutIcon from "./icons/AboutIcon";
import BlogIcon from "./icons/BlogIcon";
import ContactIcon from "./icons/ContactIcon";
import HomeIcon from "./icons/HomeIcon";
import WorksIcon from "./icons/WorksIcon";

function GlobalNav() {
	return (
		<nav className=" w-screen h-fit fixed bottom-0 md:top-0 z-10 border-neutral-100 border-b bg-white/50 backdrop-blur-sm ">
			<ul className=" flex justify-around pt-1 md:pt-2 pb-1 [&>li]:w-full [&>li]:md:w-28 [&_small]:text-[12px] [&_small]:md:text-sm">
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
				{/* <li>
					<GlobalNavItem href={"/contact"}>
						<ContactIcon />
						<Text variant="small">コンタクト</Text>
					</GlobalNavItem>
				</li> */}
			</ul>
		</nav>
	);
}

export default GlobalNav;
