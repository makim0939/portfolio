"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/**
 * 制作物ページの上部に敷く大きなサムネイル。
 *
 * 題名を読ませるために暗くしているが、動画の作品などサムネイルそのものが一番
 * 見せたい成果物のこともある。そのため、暗くしていない素の状態を全画面で見られる
 * ボタンを添えている。
 */
export function WorkCover({ src, title }: { src: string; title: string }) {
	const isVideo = src.endsWith(".mp4");
	const [isOpen, setIsOpen] = useState(false);
	// createPortal の差し込み先は body なので、サーバ側の描画と食い違わないよう
	// ブラウザに載ってからだけ全画面を描く
	const [isMounted, setIsMounted] = useState(false);
	const openButtonRef = useRef<HTMLButtonElement>(null);
	const backgroundVideoRef = useRef<HTMLVideoElement>(null);

	useEffect(() => setIsMounted(true), []);

	// 全画面側は閉じる合図を監視の登録に使うので、毎回作り直さないようにする
	const close = useCallback(() => setIsOpen(false), []);

	useEffect(() => {
		if (!isOpen) return;

		// 敷いてある動画は見えなくなるので止める
		const background = backgroundVideoRef.current;
		background?.pause();

		// 全画面の裏でページが動くと、閉じたときに元の位置を見失う
		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";

		// ブラウザの全画面に入れなかったときのための後始末。全画面に入れていれば、
		// Esc はブラウザが受け取り、抜けたことに気づいて閉じる方が働く
		const closeOnEscape = (event: KeyboardEvent) => {
			if (event.key === "Escape") setIsOpen(false);
		};
		document.addEventListener("keydown", closeOnEscape);

		return () => {
			document.removeEventListener("keydown", closeOnEscape);
			document.body.style.overflow = previousOverflow;
			background?.play().catch(() => {});
			// 閉じたあとキーボードの位置が先頭に戻らないよう、開いたボタンに返す
			openButtonRef.current?.focus();
		};
	}, [isOpen]);

	return (
		<>
			{isVideo ? (
				<video
					ref={backgroundVideoRef}
					src={src}
					width={1920}
					height={1080}
					muted
					autoPlay
					loop
					playsInline
					controls={false}
					className=" absolute w-full h-full object-cover brightness-50 bg-neutral-200 "
				/>
			) : (
				<Image
					src={src}
					width={1920}
					height={1080}
					alt={title}
					className=" absolute w-full h-full object-cover brightness-50 "
				/>
			)}

			<button
				ref={openButtonRef}
				type="button"
				onClick={() => setIsOpen(true)}
				className=" absolute z-10 right-4 bottom-4 lg:right-8 lg:bottom-8
							flex items-center gap-2 px-4 py-2 rounded-full
							bg-black/40 backdrop-blur text-neutral-50 select-none
							hover:bg-black/60 transition cursor-pointer "
			>
				<ExpandIcon />
				<span className=" text-xs md:text-sm tracking-[0.06em] ">
					{isVideo ? "動画を全画面で見る" : "全画面で見る"}
				</span>
			</button>

			{isMounted &&
				isOpen &&
				createPortal(
					<CoverOverlay
						src={src}
						isVideo={isVideo}
						title={title}
						startTime={backgroundVideoRef.current?.currentTime ?? 0}
						onClose={close}
					/>,
					document.body,
				)}
		</>
	);
}

type CoverOverlayProps = {
	src: string;
	isVideo: boolean;
	title: string;
	/** 敷いてある動画の再生位置。全画面でも続きから見せる */
	startTime: number;
	onClose: () => void;
};

function CoverOverlay({ src, isVideo, title, startTime, onClose }: CoverOverlayProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const closeButtonRef = useRef<HTMLButtonElement>(null);
	const videoRef = useRef<HTMLVideoElement>(null);

	useEffect(() => {
		closeButtonRef.current?.focus();
	}, []);

	// 画面いっぱいに敷くだけでなく、ブラウザの全画面にも入る。
	// 敷いただけだとブラウザの枠が残り、プレイヤー側の全画面ボタンと役割がぶつかるため。
	// 要素の全画面に対応しない環境（iPhoneのSafariなど）では、敷いた見た目のまま見せる。
	useEffect(() => {
		const container = containerRef.current as FullscreenCapableElement | null;
		if (!container) return;

		const request = container.requestFullscreen ?? container.webkitRequestFullscreen;
		// 断られても敷いた見た目で見られるので、そのままにする
		Promise.resolve(request?.call(container)).catch(() => {});

		return () => {
			const doc = document as FullscreenCapableDocument;
			if (!(doc.fullscreenElement ?? doc.webkitFullscreenElement)) return;
			const exit = doc.exitFullscreen ?? doc.webkitExitFullscreen;
			Promise.resolve(exit?.call(doc)).catch(() => {});
		};
	}, []);

	// Escやブラウザの操作で全画面を抜けたときは、この表示も一緒に閉じる。
	// 全画面だけ抜けて暗いままの画面が残ると、閉じ方が分からなくなるため。
	useEffect(() => {
		const closeIfLeftFullscreen = () => {
			const doc = document as FullscreenCapableDocument;
			if (!(doc.fullscreenElement ?? doc.webkitFullscreenElement)) onClose();
		};
		document.addEventListener("fullscreenchange", closeIfLeftFullscreen);
		document.addEventListener("webkitfullscreenchange", closeIfLeftFullscreen);

		return () => {
			document.removeEventListener("fullscreenchange", closeIfLeftFullscreen);
			document.removeEventListener("webkitfullscreenchange", closeIfLeftFullscreen);
		};
	}, [onClose]);

	useEffect(() => {
		const video = videoRef.current;
		if (!video) return;

		video.currentTime = startTime;
		// 成果物として見せるので音も出す。ブラウザに止められたら消音で流し直す
		video.play().catch(() => {
			video.muted = true;
			video.play().catch(() => {});
		});
	}, [startTime]);

	return (
		<div
			ref={containerRef}
			// biome-ignore lint/a11y/useSemanticElements: <dialog> は showModal() を呼ばないと開かず、開閉を state で持つこの作りに合わないため
			role="dialog"
			aria-modal="true"
			aria-label={`${title} を全画面で表示`}
			className=" fixed inset-0 z-50 bg-black "
		>
			{/* 背景のどこを押しても閉じられるようにする。div に onClick を付けると
				キーボードから押せないため、画面いっぱいのボタンを敷いている。
				閉じる手段は右上のボタンと Esc があるので、ここはタブ移動の対象から外す */}
			<button
				type="button"
				tabIndex={-1}
				aria-label="閉じる"
				onClick={onClose}
				className=" absolute inset-0 w-full h-full cursor-zoom-out "
			/>

			{/* 素材は縦横比を保って収める。動画だけは操作を受け取れるようにする */}
			<div className=" pointer-events-none absolute inset-0 flex items-center justify-center p-4 sm:p-8 ">
				{isVideo ? (
					// biome-ignore lint/a11y/useMediaCaption: 作品の動画に台詞はなく、字幕のデータも持っていないため
					<video
						ref={videoRef}
						src={src}
						loop
						playsInline
						controls
						// 全画面の出入りは「閉じる」ボタンに一本化する。プレイヤー側にも全画面の
						// ボタンが並ぶと、どちらを押せばいいのか分からなくなるため隠す
						// （この指定が効かないブラウザ向けに globals.css でも隠している）
						controlsList="nofullscreen"
						className=" work-cover-video pointer-events-auto w-full h-full object-contain "
					/>
				) : (
					<Image
						src={src}
						width={1920}
						height={1080}
						alt={title}
						className=" w-full h-full object-contain "
					/>
				)}
			</div>

			<button
				ref={closeButtonRef}
				type="button"
				onClick={onClose}
				className=" absolute z-10 top-4 right-4 lg:top-8 lg:right-8
							flex items-center gap-2 px-4 py-2 rounded-full
							bg-white/10 backdrop-blur text-neutral-50 select-none
							hover:bg-white/20 transition cursor-pointer "
			>
				<CloseIcon />
				<span className=" text-xs md:text-sm tracking-[0.06em] ">閉じる</span>
			</button>
		</div>
	);
}

/** 全画面の出入りは、接頭辞つきの名前しか持たないブラウザがある */
type FullscreenCapableElement = HTMLDivElement & {
	webkitRequestFullscreen?: () => Promise<void> | void;
};
type FullscreenCapableDocument = Document & {
	webkitFullscreenElement?: Element | null;
	webkitExitFullscreen?: () => Promise<void> | void;
};

function ExpandIcon() {
	return (
		<svg
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<path d="M9 3H3v6M21 9V3h-6M3 15v6h6M15 21h6v-6" />
		</svg>
	);
}

function CloseIcon() {
	return (
		<svg
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<path d="M5 5l14 14M19 5L5 19" />
		</svg>
	);
}
