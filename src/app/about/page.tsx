import { FadeInContainer } from "@/components/ui/FadeInContainer";
import { Text } from "@/components/ui/Text";

export default function AboutPage() {
	return (
		<main className=" lg:w-[40vw] ">
			<Text variant="h1" className="mb-8">
				プロフィール
			</Text>
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
					私のこと、このサイトのこと、その他なんでもDM・メールから気軽に話かけてください。
				</Text>
			</FadeInContainer>
		</main>
	);
}
