import { FadeInContainer } from "@/components/ui/FadeInContainer";
import { StyledLink } from "@/components/ui/StyledLink";
import { Text } from "@/components/ui/Text";
import { AUTHOR_NAME } from "@/lib/site";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "プロフィール",
	description: `${AUTHOR_NAME}について。作っているもの、使っている道具、これまでのことを書いています。`,
	alternates: { canonical: "/about" },
};

export default function AboutPage() {
	return (
		<main className=" min-h-[75vh] lg:max-w-6xl lg:m-auto ">
			<header>
				<Text variant="h1" className="mb-8">
					プロフィール
				</Text>
				<hr className="my-8" />
			</header>
			<FadeInContainer className="[&>*]:my-8 [&>div]:md:my-4">
				<Text>まきむらです。名古屋のソフト開発を主軸とする会社に勤めています。</Text>
				<Text>
					プログラミングで何か作ったり、3DCGをこねたり、絵を描いたり、楽器を弾いたりしています。
					それらを組み合わせたコンテンツで価値を生み出せるようになりたいです。
				</Text>

				<Text>
					それぞれの分野に憧れの人がいて、「かっこいいな」「こうなりたいな」というのが私の原動力になっています。
				</Text>

				<Text>
					私のこと、このサイトのこと、その他なんでも
					<StyledLink href="/contact">
						<u>コンタクト</u>
					</StyledLink>
					やDMから気軽に話かけてください。
				</Text>
			</FadeInContainer>
		</main>
	);
}
