"use client";

import Image from "next/image";
import { useRef, useState } from "react";

type AudioPlayerProps = {
	title: string;
	src: string;
	/** 音源の種類（audio/mpeg など）。分かっていれば読み込む前にブラウザへ伝える */
	type?: string;
	/** 曲の絵。無ければ音符の印を出す */
	artwork?: string;
};

/**
 * MVを作っていない曲を、音源のまま聴いてもらうためのプレイヤー。
 *
 * ブラウザ既定の見た目を使わず組み立てているのは、時間帯で色が変わるページの上に
 * 置くため。既定のプレイヤーは環境ごとに配色も大きさもばらばらで、作品ページの
 * 主役に据えられない。
 *
 * 音源は数MBあるので、押されるまで読み込まない（preload="none"）。聴くとは限らない
 * 人に自動で配らないためで、動画の埋め込みを押すまで読み込まないのと同じ考え方。
 */
export function AudioPlayer({ title, src, type, artwork }: AudioPlayerProps) {
	const audioRef = useRef<HTMLAudioElement>(null);
	const [isPlaying, setIsPlaying] = useState(false);
	const [isWaiting, setIsWaiting] = useState(false);
	const [currentTime, setCurrentTime] = useState(0);
	// 読み込む前は長さが分からない。分かるまでは NaN のままにして --:-- と出す
	const [duration, setDuration] = useState(Number.NaN);

	const hasDuration = Number.isFinite(duration) && duration > 0;
	const progress = hasDuration ? (currentTime / duration) * 100 : 0;

	const toggle = () => {
		const audio = audioRef.current;
		if (!audio) return;
		if (audio.paused) {
			// 押してから鳴り出すまで間があるので、待っていることを見せる
			setIsWaiting(true);
			audio.play().catch(() => setIsWaiting(false));
		} else {
			audio.pause();
		}
	};

	const seek = (seconds: number) => {
		const audio = audioRef.current;
		if (!audio) return;
		audio.currentTime = seconds;
		// timeupdate を待つと、つまんで動かしている間つまみが戻って見える
		setCurrentTime(seconds);
	};

	return (
		<div
			className=" flex flex-col sm:flex-row items-center gap-5 sm:gap-8 p-5 sm:p-6
						rounded-2xl border bg-[var(--surface)] shadow-lg "
		>
			<div className=" relative shrink-0 w-40 sm:w-36 md:w-44 aspect-square rounded-xl overflow-hidden bg-neutral-200 ">
				{artwork ? (
					<Image src={artwork} alt={title} fill className=" object-cover " />
				) : (
					<span className=" absolute inset-0 grid place-items-center text-neutral-400 ">
						<NoteIcon className=" w-12 h-12 " />
					</span>
				)}
			</div>

			<div className=" w-full flex items-center gap-4 sm:gap-5 min-w-0 ">
				<button
					type="button"
					onClick={toggle}
					aria-label={isPlaying ? `${title} を一時停止する` : `${title} を再生する`}
					className=" shrink-0 grid place-items-center w-14 h-14 rounded-full
								bg-neutral-900 text-neutral-50 hover:bg-neutral-700 transition cursor-pointer "
				>
					{isWaiting ? <SpinnerIcon /> : isPlaying ? <PauseIcon /> : <PlayIcon />}
				</button>

				<div className=" flex-1 min-w-0 space-y-2 ">
					<SeekBar
						progress={progress}
						currentTime={currentTime}
						duration={duration}
						disabled={!hasDuration}
						onSeek={seek}
					/>
					<div className=" flex justify-between text-xs text-neutral-500 tabular-nums ">
						<time dateTime={`PT${Math.floor(currentTime)}S`}>{formatTime(currentTime)}</time>
						<time dateTime={hasDuration ? `PT${Math.floor(duration)}S` : undefined}>
							{formatTime(duration)}
						</time>
					</div>
				</div>
			</div>

			{/* biome-ignore lint/a11y/useMediaCaption: 曲そのものが作品で、歌詞の字幕データを持っていないため */}
			<audio
				ref={audioRef}
				// src ではなく source で渡している。種類を添えておくと、鳴らせない形式の
				// ときにブラウザが読み込む前に判断できるため
				preload="none"
				onPlay={() => setIsPlaying(true)}
				onPlaying={() => setIsWaiting(false)}
				onWaiting={() => setIsWaiting(true)}
				onPause={() => {
					setIsPlaying(false);
					setIsWaiting(false);
				}}
				onEnded={() => setIsPlaying(false)}
				onDurationChange={(event) => setDuration(event.currentTarget.duration)}
				onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
			>
				<source src={src} type={type} />
			</audio>
		</div>
	);
}

type SeekBarProps = {
	progress: number;
	currentTime: number;
	duration: number;
	disabled: boolean;
	onSeek: (seconds: number) => void;
};

/**
 * 再生位置のバー。見た目は div で描き、操作は透明にした range に任せている。
 * range の見た目はブラウザごとに違い、揃えるには疑似要素ごとの指定が要るため。
 */
function SeekBar({ progress, currentTime, duration, disabled, onSeek }: SeekBarProps) {
	return (
		<div className=" relative h-4 flex items-center ">
			<div className=" w-full h-1 rounded-full bg-neutral-200 overflow-hidden ">
				<div className=" h-full rounded-full bg-neutral-900 " style={{ width: `${progress}%` }} />
			</div>
			{/* つまみ。押せる場所は下の range なので、当たり判定は持たせない */}
			<span
				className=" pointer-events-none absolute w-3 h-3 -ml-1.5 rounded-full bg-neutral-900 "
				style={{ left: `${progress}%` }}
			/>
			<input
				type="range"
				min={0}
				max={Number.isFinite(duration) && duration > 0 ? duration : 0}
				step={0.1}
				value={currentTime}
				disabled={disabled}
				onChange={(event) => onSeek(Number(event.target.value))}
				aria-label="再生位置"
				aria-valuetext={formatTime(currentTime)}
				className=" absolute inset-0 w-full h-4 opacity-0 cursor-pointer disabled:cursor-default "
			/>
		</div>
	);
}

/** 秒を m:ss にする。読み込む前など長さが分からないうちは --:-- */
function formatTime(seconds: number): string {
	if (!Number.isFinite(seconds)) return "--:--";
	const whole = Math.floor(seconds);
	const minutes = Math.floor(whole / 60);
	return `${minutes}:${(whole % 60).toString().padStart(2, "0")}`;
}

/** 一覧のカードに出す、音を聴く作品の印。動画の再生ボタンと同じ位置に置く */
export function AudioBadge({ className = "" }: { className?: string }) {
	return (
		<span
			className={` flex items-center justify-center w-16 h-16 rounded-full
						bg-black/60 text-neutral-50 ${className} `}
		>
			<NoteIcon className=" w-1/2 h-1/2 " />
		</span>
	);
}

function NoteIcon({ className = "" }: { className?: string }) {
	return (
		<svg viewBox="0 0 24 24" className={className} role="img" aria-label="音源">
			<path
				d="M9 18V6l10-2v12"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<circle cx="6.5" cy="18" r="2.5" fill="currentColor" />
			<circle cx="16.5" cy="16" r="2.5" fill="currentColor" />
		</svg>
	);
}

function PlayIcon() {
	return (
		<svg width="22" height="22" viewBox="0 0 24 24" role="img" aria-label="再生">
			<path d="M8 5.5 L19 12 L8 18.5 Z" fill="currentColor" />
		</svg>
	);
}

function PauseIcon() {
	return (
		<svg width="22" height="22" viewBox="0 0 24 24" role="img" aria-label="一時停止">
			<path d="M7 5h4v14H7zM13 5h4v14h-4z" fill="currentColor" />
		</svg>
	);
}

/** 押してから鳴り出すまでの間に回す輪 */
function SpinnerIcon() {
	return (
		<svg
			width="22"
			height="22"
			viewBox="0 0 24 24"
			className=" animate-spin "
			role="img"
			aria-label="読み込み中"
		>
			<circle
				cx="12"
				cy="12"
				r="9"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				opacity="0.3"
			/>
			<path
				d="M12 3a9 9 0 0 1 9 9"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
			/>
		</svg>
	);
}
