"use client";

import { Text } from "@/components/ui/Text";
import {
	MAX_BODY_LENGTH,
	MAX_NAME_LENGTH,
	REPLY_LEAD_TIME,
	validateContactInput,
} from "@/lib/contact";
import { useEffect, useId, useRef, useState } from "react";

/*
	送信方法を選ばせる操作は置かない（Issue #72）。
	メールアドレスを書けば返信が届き、空欄なら送りっぱなしになる、という形にしている。
*/

/** 書きかけを預けておく場所。本文だけ。名前とメールは端末に残さない */
const DRAFT_KEY = "contact-draft";

type Status = "idle" | "sending" | "sent" | "error";

const fieldClass =
	" w-full px-4 py-3 rounded-xl bg-[var(--surface)] border border-neutral-300 text-base" +
	" placeholder:text-neutral-400 focus:outline-none focus:border-maki-black transition ";

export function ContactForm() {
	const bodyId = useId();
	const nameId = useId();
	const emailId = useId();

	const [body, setBody] = useState("");
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [website, setWebsite] = useState(""); // 人には見せない罠
	const [status, setStatus] = useState<Status>("idle");
	const [message, setMessage] = useState("");
	/** 送った内容にメールアドレスが無かったとき、書き直せるよう本文を持っておく */
	const [unrepliable, setUnrepliable] = useState<string | null>(null);
	/** フォームが戻ってきてからでないと入力欄を掴めないので、いったん旗を立てる */
	const [focusEmailNext, setFocusEmailNext] = useState(false);

	const openedAt = useRef(Date.now());
	const emailRef = useRef<HTMLInputElement>(null);

	// 書きかけのまま離れて戻ってきた人のために、本文だけ戻す
	useEffect(() => {
		const draft = localStorage.getItem(DRAFT_KEY);
		if (draft) setBody(draft);
	}, []);

	useEffect(() => {
		if (body) localStorage.setItem(DRAFT_KEY, body);
		else localStorage.removeItem(DRAFT_KEY);
	}, [body]);

	useEffect(() => {
		if (!focusEmailNext) return;
		emailRef.current?.focus();
		setFocusEmailNext(false);
	}, [focusEmailNext]);

	async function handleSubmit(event: React.FormEvent) {
		event.preventDefault();
		if (status === "sending") return;

		const input = { body, name, email };
		const invalid = validateContactInput(input);
		if (invalid) {
			setStatus("error");
			setMessage(invalid);
			return;
		}

		setStatus("sending");
		setMessage("");

		try {
			const res = await fetch("/api/contact", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					...input,
					website,
					elapsedMs: Date.now() - openedAt.current,
				}),
			});
			const data: { message?: string } = await res.json();

			if (!res.ok) {
				setStatus("error");
				setMessage(data.message ?? "送信できませんでした。");
				return;
			}

			setStatus("sent");
			setMessage(data.message ?? "届きました。");
			setUnrepliable(email ? null : body);
			setBody("");
			setName("");
			setEmail("");
		} catch {
			setStatus("error");
			setMessage("送信できませんでした。通信の状態をご確認ください。");
		}
	}

	/** 匿名で送ったあとに、返信がほしくなった人のための戻り道 */
	function reopenWithEmail() {
		if (unrepliable) setBody(unrepliable);
		setUnrepliable(null);
		setStatus("idle");
		setMessage("");
		openedAt.current = Date.now();
		setFocusEmailNext(true);
	}

	if (status === "sent") {
		return (
			<div className=" p-6 md:p-8 rounded-2xl bg-[var(--surface)] border border-neutral-200 space-y-4 ">
				<Text variant="h3" className=" text-lg md:text-xl ">
					{message}
				</Text>

				{unrepliable ? (
					<>
						<Text variant="small">
							メールアドレスが空欄だったので、こちらからお返事はできません。
							お返事がほしい場合は、メールアドレスを添えてもう一度送ってください。
						</Text>
						<button
							type="button"
							onClick={reopenWithEmail}
							className=" px-5 py-2.5 rounded-full border border-maki-black text-sm hover:shadow-sm transition "
						>
							メールアドレスを添えて送り直す
						</button>
					</>
				) : (
					<Text variant="small">
						控えを送りましたので、届いているかご確認ください。
						このメールにそのまま返信していただいても大丈夫です。
					</Text>
				)}
			</div>
		);
	}

	return (
		<form onSubmit={handleSubmit} className=" space-y-6 ">
			<div className=" space-y-2 ">
				<label htmlFor={bodyId} className=" block text-sm text-maki-gray ">
					本文
				</label>
				<textarea
					id={bodyId}
					value={body}
					onChange={(e) => setBody(e.target.value)}
					rows={8}
					maxLength={MAX_BODY_LENGTH}
					required
					// 何を書けるかはページの頭に書いてあるので、ここで繰り返さない
					className={`${fieldClass} resize-y leading-8 `}
				/>
			</div>

			<div className=" grid gap-6 md:grid-cols-2 ">
				<div className=" space-y-2 ">
					<label htmlFor={nameId} className=" block text-sm text-maki-gray ">
						お名前・ニックネーム<span className=" ml-2 text-xs ">任意</span>
					</label>
					<input
						id={nameId}
						type="text"
						value={name}
						onChange={(e) => setName(e.target.value)}
						maxLength={MAX_NAME_LENGTH}
						autoComplete="nickname"
						placeholder="お呼びする名前があれば"
						className={fieldClass}
					/>
				</div>

				<div className=" space-y-2 ">
					<label htmlFor={emailId} className=" block text-sm text-maki-gray ">
						メールアドレス<span className=" ml-2 text-xs ">任意</span>
					</label>
					<input
						id={emailId}
						ref={emailRef}
						type="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						autoComplete="email"
						placeholder="お返事が必要な場合はこちらへ"
						className={fieldClass}
					/>
				</div>
			</div>

			{/*
				機械よけ。人の目にも読み上げにも触れないよう画面の外に出し、
				タブでも止まらないようにしている。ここが埋まっていたら人ではない。
			*/}
			<div className=" absolute left-[-9999px] " aria-hidden="true">
				<label htmlFor="contact-website">この欄は書かないでください</label>
				<input
					id="contact-website"
					type="text"
					tabIndex={-1}
					autoComplete="off"
					value={website}
					onChange={(e) => setWebsite(e.target.value)}
				/>
			</div>

			<div className=" space-y-3 ">
				<button
					type="submit"
					disabled={status === "sending"}
					className=" px-8 py-3 rounded-full bg-maki-black text-neutral-50 hover:shadow-md disabled:opacity-50 transition "
				>
					{status === "sending" ? "送っています…" : "送信する"}
				</button>

				<Text variant="small">
					メールアドレスを入れていただくと、{REPLY_LEAD_TIME}にお返事します。
					空欄のままでも送れます（その場合はお返事できません）。
				</Text>

				<Text variant="small" className=" text-xs ">
					いただいた内容は、お返事のためだけに使います。
					サイトには保存せず、私のメールに届くだけです。
				</Text>

				{status === "error" && (
					<Text variant="small" role="alert" className=" text-red-600 ">
						{message}
					</Text>
				)}
			</div>
		</form>
	);
}
