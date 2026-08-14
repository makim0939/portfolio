import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "コンタクト",
	description: "お問い合わせ先です。メールもしくは各種SNSのDMからご連絡ください。",
	alternates: { canonical: "/contact" },
};

export default function ContactPage() {
	return (
		<main className="min-h-screen">
			<h1 className="text-3xl font-bold mb-4">コンタクト</h1>
			<p className="text-lg">メールもしくは各種SNSのDMからご連絡ください。</p>
		</main>
	);
}
