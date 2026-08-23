"use client";

import Image from "next/image";
import { type AudioTrack, useAudioPlayer } from "./AudioPlayerProvider";

/**
 * 作品ページの大きいプレイヤー。
 *
 * 音そのものは AudioPlayerProvider が持っていて、ここはその状態を映して操作を
 * 渡すだけ。ページを移っても曲が続くようにするため、`<audio>` は持たない。
 *
 * ブラウザ既定の見た目を使わず組み立てているのは、時間帯で色が変わるページの上に
 * 置くため。既定のプレイヤーは環境ごとに配色も大きさもばらばらで、作品ページの
 * 主役に据えられない。
 */
export function AudioPlayer({ track }: { track: AudioTrack }) {
	const player = useAudioPlayer();
	// 別の曲が載っているときは、この曲は手つかずの状態で出す
	const isCurrent = player.track?.slug === track.slug;
	const isPlaying = isCurrent && player.isPlaying;
	const currentTime = isCurrent ? player.currentTime : 0;
	const duration = isCurrent ? player.duration : Number.NaN;

	return (
		<div
			className=" flex flex-col sm:flex-row items-center gap-5 sm:gap-8 p-5 sm:p-6
						rounded-2xl border bg-[var(--surface)] shadow-lg "
		>
			<div className=" relative shrink-0 w-40 sm:w-36 md:w-44 aspect-square rounded-xl overflow-hidden bg-neutral-200 ">
				{track.artwork ? (
					<Image src={track.artwork} alt={track.title} fill className=" object-cover " />
				) : (
					<span className=" absolute inset-0 grid place-items-center text-neutral-400 ">
						<NoteIcon className=" w-12 h-12 " />
					</span>
				)}
			</div>

			<div className=" w-full flex items-center gap-4 sm:gap-5 min-w-0 ">
				<PlayPauseButton
					title={track.title}
					isPlaying={isPlaying}
					isWaiting={isCurrent && player.isWaiting}
					onClick={() => (isPlaying ? player.pause() : player.play(track))}
					className=" w-14 h-14 "
				/>

				<div className=" flex-1 min-w-0 space-y-2 ">
					<SeekBar currentTime={currentTime} duration={duration} onSeek={player.seek} />
					<div className=" flex justify-between text-xs text-neutral-500 tabular-nums ">
						<time dateTime={`PT${Math.floor(currentTime)}S`}>{formatTime(currentTime)}</time>
						<time dateTime={hasDuration(duration) ? `PT${Math.floor(duration)}S` : undefined}>
							{formatTime(duration)}
						</time>
					</div>
				</div>
			</div>
		</div>
	);
}

/** 読み込む前は長さが分からないので、バーを動かせるかの判断に使う */
export function hasDuration(duration: number): boolean {
	return Number.isFinite(duration) && duration > 0;
}

type SeekBarProps = {
	currentTime: number;
	duration: number;
	onSeek: (seconds: number) => void;
	/** ミニプレイヤー用の細いバー。押せる高さは変えない */
	thin?: boolean;
};

/**
 * 再生位置のバー。見た目は div で描き、操作は透明にした range に任せている。
 * range の見た目はブラウザごとに違い、揃えるには疑似要素ごとの指定が要るため。
 */
export function SeekBar({ currentTime, duration, onSeek, thin = false }: SeekBarProps) {
	const seekable = hasDuration(duration);
	const progress = seekable ? (currentTime / duration) * 100 : 0;

	return (
		<div className=" relative h-4 flex items-center ">
			<div
				className={` w-full rounded-full bg-neutral-200 overflow-hidden ${thin ? " h-0.5 " : " h-1 "} `}
			>
				<div className=" h-full rounded-full bg-neutral-900 " style={{ width: `${progress}%` }} />
			</div>
			{/* つまみ。押せる場所は下の range なので、当たり判定は持たせない */}
			<span
				className={` pointer-events-none absolute rounded-full bg-neutral-900
							${thin ? " w-2 h-2 -ml-1 " : " w-3 h-3 -ml-1.5 "} `}
				style={{ left: `${progress}%` }}
			/>
			<input
				type="range"
				min={0}
				max={seekable ? duration : 0}
				step={0.1}
				value={currentTime}
				disabled={!seekable}
				onChange={(event) => onSeek(Number(event.target.value))}
				aria-label="再生位置"
				aria-valuetext={formatTime(currentTime)}
				className=" absolute inset-0 w-full h-4 opacity-0 cursor-pointer disabled:cursor-default "
			/>
		</div>
	);
}

type PlayPauseButtonProps = {
	title: string;
	isPlaying: boolean;
	isWaiting: boolean;
	onClick: () => void;
	className?: string;
};

export function PlayPauseButton({
	title,
	isPlaying,
	isWaiting,
	onClick,
	className = "",
}: PlayPauseButtonProps) {
	return (
		<button
			type="button"
			onClick={onClick}
			aria-label={isPlaying ? `${title} を一時停止する` : `${title} を再生する`}
			className={` shrink-0 grid place-items-center rounded-full bg-neutral-900 text-neutral-50
						hover:bg-neutral-700 transition cursor-pointer ${className} `}
		>
			{isWaiting ? <SpinnerIcon /> : isPlaying ? <PauseIcon /> : <PlayIcon />}
		</button>
	);
}

/** 秒を m:ss にする。読み込む前など長さが分からないうちは --:-- */
export function formatTime(seconds: number): string {
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

export function NoteIcon({ className = "" }: { className?: string }) {
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
