import {
	type ContactInput,
	MIN_ELAPSED_MS,
	REPLY_LEAD_TIME,
	validateContactInput,
} from "@/lib/contact";
import { sendContactMail } from "@/lib/contactMail";
import { NextResponse } from "next/server";

/*
	コンタクトフォームの受け口。

	迷惑メッセージ対策は、普通に使う人に何もさせない範囲だけ入れている。
	画像を選ばせるような確認は、荒らされてから足す（Issue #72）。
*/

/** この時間の中で受け付ける通数を数える */
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 3;

/*
	送信元ごとの送信時刻。

	インスタンスごとに別の記憶になるので取りこぼしはあるが、
	1台に連投してくる素朴な機械はこれで止まる。抜けられるようなら外に置く。
*/
const history = new Map<string, number[]>();

function isTooFrequent(key: string): boolean {
	const now = Date.now();
	const recent = (history.get(key) ?? []).filter((at) => now - at < WINDOW_MS);

	if (recent.length >= MAX_PER_WINDOW) {
		history.set(key, recent);
		return true;
	}

	recent.push(now);
	history.set(key, recent);

	// 使われないまま残った分を捨てる。少量なので全部見てよい
	for (const [oldKey, times] of history) {
		if (times.every((at) => now - at >= WINDOW_MS)) history.delete(oldKey);
	}
	return false;
}

function senderKey(request: Request): string {
	const forwarded = request.headers.get("x-forwarded-for");
	return forwarded?.split(",")[0].trim() || "unknown";
}

function asText(value: unknown): string {
	return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
	let payload: Record<string, unknown>;
	try {
		payload = await request.json();
	} catch {
		return NextResponse.json({ message: "内容を読み取れませんでした。" }, { status: 400 });
	}

	/*
		以下2つは人には見えない仕掛け。引っかかったときは弾いたことを伝えず、
		送れたときと同じ返事をする。何が原因で止まったのか教えないため。
	*/
	const filledHoneypot = asText(payload.website) !== "";
	const tooFast = typeof payload.elapsedMs !== "number" || payload.elapsedMs < MIN_ELAPSED_MS;
	if (filledHoneypot || tooFast) {
		return NextResponse.json({ message: "受け取りました。" });
	}

	const input: ContactInput = {
		body: asText(payload.body),
		name: asText(payload.name),
		email: asText(payload.email),
	};

	const invalid = validateContactInput(input);
	if (invalid) {
		return NextResponse.json({ message: invalid }, { status: 400 });
	}

	if (isTooFrequent(senderKey(request))) {
		return NextResponse.json(
			{ message: "短い間にたくさん届いています。しばらく空けてからお試しください。" },
			{ status: 429 },
		);
	}

	try {
		await sendContactMail(input);
	} catch (error) {
		console.error("[contact] 送信に失敗しました:", error);
		return NextResponse.json(
			{ message: "送信できませんでした。お手数ですが、SNSのDMからご連絡ください。" },
			{ status: 500 },
		);
	}

	return NextResponse.json({
		message: input.email
			? `届きました。${REPLY_LEAD_TIME}にお返事します。`
			: "届きました。ありがとうございます。",
	});
}
