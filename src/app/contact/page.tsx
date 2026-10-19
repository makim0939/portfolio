import { ContactForm } from "@/components/ui/ContactForm";
import { SocialLinkIcon } from "@/components/ui/SocialLinkIcon";
import { Text } from "@/components/ui/Text";
import { socialLinks } from "@/lib/socialLinks";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "コンタクト",
	description: "お仕事のご相談、サイトの感想、雑談など、気軽にご連絡ください。",
	alternates: { canonical: "/contact" },
};

export default function ContactPage() {
	return (
		<main className=" min-h-[75vh] lg:max-w-3xl lg:m-auto ">
			<header>
				<Text variant="h1" className=" mb-8 ">
					コンタクト
				</Text>
				<Text>お気軽にご連絡ください。返信が必要な方はメールアドレスの記入もお願いします。</Text>
				<hr className=" my-8 " />
			</header>

			<ContactForm />

			<section className=" mt-16 ">
				<Text variant="small">SNSのDMからでも届きます。</Text>
				<ul className=" flex gap-3 mt-3 ">
					{socialLinks.map((socialLink) => (
						<li key={socialLink.name}>
							<SocialLinkIcon
								socialLinkData={socialLink}
								svgAttr={{ width: 24, height: 24, fill: "#252528" }}
							/>
						</li>
					))}
				</ul>
			</section>
		</main>
	);
}
