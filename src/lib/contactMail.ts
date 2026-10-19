// フォームで受け取った内容をメールで流すところ。
//
// やり取りの本体をメールに置いているので、サイト側にデータベースを持たない。
// 届いた内容は自分の受信箱に残り、返信は普段のメールから書ける。

import { type ContactInput, REPLY_LEAD_TIME } from "@/lib/contact";
import { SITE_NAME } from "@/lib/site";

const ENDPOINT = "https://api.resend.com/emails";

/**
 * 送れなかった理由を、画面には出さずに外から見分けられる短い文字列で持つ。
 *
 * 本番でメールが送れないとき、画面に出る文言は1つだけで、設定漏れなのか、
 * 送信サービスに断られたのかが分からない。理由はサーバのログにしかないので、
 * 返事にも秘密を含まない形で添えて、ログを開かなくても切り分けられるようにしている。
 * 中身は環境変数の名前、HTTPの状態、送信サービスが返すエラーの種類だけ。
 */
export class ContactMailError extends Error {
	constructor(
		message: string,
		/** `config:名前,...` / `mail:状態:種類` / `network` のいずれか */
		readonly reason: string,
		options?: ErrorOptions,
	) {
		super(message, options);
		this.name = "ContactMailError";
	}
}

type MailConfig = {
	apiKey: string;
	/** 差出人。送信サービスで所有を確認したドメインである必要がある */
	from: string;
	/** 自分の受信先 */
	to: string;
};

/**
 * 環境変数の値。管理画面に貼り付けるとき、前後の空白・改行や、値全体を囲む引用符が
 * 混ざりやすい。混ざると送信サービスに別の値として渡って、原因の分かりにくい失敗になる。
 */
function readEnv(name: string): string {
	return (process.env[name] ?? "")
		.trim()
		.replace(/^(["'])([\s\S]*)\1$/, "$2")
		.trim();
}

/** 設定が揃っていなければ config は null。開発中は設定なしでも画面を試せるようにするため */
function readConfig(): { config: MailConfig | null; missing: string[] } {
	const apiKey = readEnv("RESEND_API_KEY");
	const from = readEnv("CONTACT_FROM_EMAIL");
	const to = readEnv("CONTACT_TO_EMAIL");

	const missing = [
		["RESEND_API_KEY", apiKey],
		["CONTACT_FROM_EMAIL", from],
		["CONTACT_TO_EMAIL", to],
	]
		.filter(([, value]) => !value)
		.map(([name]) => name);

	if (missing.length > 0) return { config: null, missing };
	return { config: { apiKey, from, to }, missing };
}

/** 送信サービスのエラー本文から、エラーの種類だけ取り出す（例 `invalid_api_key`） */
function errorKind(body: string): string {
	try {
		const name = JSON.parse(body)?.name;
		return typeof name === "string" && /^[a-z_]{1,40}$/.test(name) ? name : "";
	} catch {
		return "";
	}
}

async function send(
	config: MailConfig,
	mail: { to: string; subject: string; text: string; replyTo?: string },
) {
	let res: Response;
	try {
		res = await fetch(ENDPOINT, {
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
	} catch (cause) {
		throw new ContactMailError("送信サービスに接続できませんでした。", "network", { cause });
	}

	if (!res.ok) {
		const detail = await res.text();
		const kind = errorKind(detail);
		throw new ContactMailError(
			`メールを送れませんでした: ${res.status} ${detail}`,
			`mail:${res.status}${kind ? `:${kind}` : ""}`,
		);
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
	const { config, missing } = readConfig();

	if (!config) {
		// 本番で設定漏れなら、黙って捨てずに落とす。開発中は中身を出して素通しする
		if (process.env.NODE_ENV === "production") {
			throw new ContactMailError(
				`メールの送信設定がありません: ${missing.join(", ")}`,
				`config:${missing.join(",")}`,
			);
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
