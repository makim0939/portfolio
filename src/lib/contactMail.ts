// フォームで受け取った内容をメールで流すところ。
//
// やり取りの本体をメールに置いているので、サイト側にデータベースを持たない。
// 届いた内容は自分の受信箱に残り、返信は普段のメールから書ける。

import { type ContactInput, REPLY_LEAD_TIME } from "@/lib/contact";
import { SITE_NAME } from "@/lib/site";

const ENDPOINT = "https://api.resend.com/emails";

type MailConfig = {
	apiKey: string;
	/** 差出人。送信サービスで所有を確認したドメインである必要がある */
	from: string;
	/** 自分の受信先 */
	to: string;
};

/** 設定が揃っていなければ null。開発中は設定なしでも画面を試せるようにするため */
function readConfig(): MailConfig | null {
	const apiKey = process.env.RESEND_API_KEY;
	const from = process.env.CONTACT_FROM_EMAIL;
	const to = process.env.CONTACT_TO_EMAIL;
	if (!apiKey || !from || !to) return null;
	return { apiKey, from, to };
}

async function send(
	config: MailConfig,
	mail: { to: string; subject: string; text: string; replyTo?: string },
) {
	const res = await fetch(ENDPOINT, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${config.apiKey}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			from: config.from,
			to: [mail.to],
			subject: mail.subject,
			text: mail.text,
			...(mail.replyTo ? { reply_to: [mail.replyTo] } : {}),
		}),
	});

	if (!res.ok) {
		throw new Error(`メールを送れませんでした: ${res.status} ${await res.text()}`);
	}
}

function describeSender({ name, email }: ContactInput): string {
	if (name && email) return `${name}（${email}）`;
	if (name) return `${name}（メールアドレスなし）`;
	if (email) return `お名前なし（${email}）`;
	return "匿名";
}

/**
 * 自分宛の1通と、送信者宛の控え1通を送る。
 *
 * 控えの失敗で全体を失敗にはしない。本体はもう自分に届いていて、そこで
 * 「送れませんでした」と出すと、相手に同じ内容を送り直させることになるため。
 */
export async function sendContactMail(input: ContactInput): Promise<void> {
	const config = readConfig();

	if (!config) {
		// 本番で設定漏れなら、黙って捨てずに落とす。開発中は中身を出して素通しする
		if (process.env.NODE_ENV === "production") {
			throw new Error("メールの送信設定がありません。");
		}
		console.info("[contact] 送信設定がないので送りません:", input);
		return;
	}

	await send(config, {
		to: config.to,
		subject: `[${SITE_NAME}] ${describeSender(input)} からメッセージ`,
		// 返信を押すだけで相手に返せるよう、宛先を差出人ではなく本人に向ける
		replyTo: input.email || undefined,
		text: [`差出人: ${describeSender(input)}`, "", input.body].join("\n"),
	});

	if (!input.email) return;

	try {
		await send(config, {
			to: input.email,
			subject: `[${SITE_NAME}] メッセージを受け取りました`,
			text: [
				`${input.name || "こんにちは"}さん`,
				"",
				`メッセージをありがとうございます。${REPLY_LEAD_TIME}に、このメールアドレス宛にお返事します。`,
				"このメールに返信していただいても届きます。",
				"",
				"― いただいた内容 ―",
				input.body,
			].join("\n"),
		});
	} catch (error) {
		console.error("[contact] 控えを送れませんでした:", error);
	}
}
