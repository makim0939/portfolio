// コンタクトフォームの決まりごと。
// 同じ判定を画面側とAPI側の両方でやるので、文言ごとここに置いて食い違わないようにしている。

/** 画面に出す返信の目安。守れる幅で書く */
export const REPLY_LEAD_TIME = "数日以内";

/** 本文の上限。長文の相談を切らない程度に取って、機械的な大量投稿だけ弾く */
export const MAX_BODY_LENGTH = 2000;
export const MAX_NAME_LENGTH = 50;
/** メールアドレスの最大長（RFC 5321） */
export const MAX_EMAIL_LENGTH = 254;

/**
 * 開いてから送信するまでにこれだけ経っていなければ機械とみなす。
 * 人が本文を読んで書いて押すには短すぎる時間。
 */
export const MIN_ELAPSED_MS = 3000;

export type ContactInput = {
	body: string;
	/** 空欄可。呼び方であって、返信先ではない */
	name: string;
	/** 空欄可。書いてあれば返信でき、なければ送りっぱなしになる */
	email: string;
};

/*
	形だけ見る。ここで厳密に弾いても、実在するアドレスかどうかは分からないので、
	打ち間違いの気づきになれば十分。
*/
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** 問題があればそのまま画面に出せる文を返す。問題なければ null */
export function validateContactInput({ body, name, email }: ContactInput): string | null {
	if (!body.trim()) return "本文を書いてください。";
	if (body.length > MAX_BODY_LENGTH) return `本文は${MAX_BODY_LENGTH}文字までです。`;
	if (name.length > MAX_NAME_LENGTH) return `お名前は${MAX_NAME_LENGTH}文字までです。`;
	if (email && email.length > MAX_EMAIL_LENGTH) return "メールアドレスが長すぎます。";
	if (email && !EMAIL_SHAPE.test(email)) return "メールアドレスの形をご確認ください。";
	return null;
}
