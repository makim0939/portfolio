"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { NoteIcon, PlayPauseButton, SeekBar, formatTime, hasDuration } from "./AudioPlayer";
import { useAudioPlayer } from "./AudioPlayerProvider";

/**
 * 曲を載せたままページを移ったときに、画面の隅に残るプレイヤー。
 *
 * 曲のページには大きいプレイヤーがあるので、そこでは出さない。同じ画面に
 * プレイヤーが2つ並ぶと、どちらを操作しているのか分からなくなるため。
 *
 * 一時停止しても出したままにする。止めた時点で消すと、聴き直す手立てが
 * 無くなるため。消えるのは「閉じる」を押したときだけ。
 */
export function MiniPlayer() {
	const player = useAudioPlayer();
	const pathname = usePathname();
	const { track } = player;
	const isVisible = Boolean(track) && pathname !== `/works/${track?.slug}`;

	// 出ている間はページの下に余白を足す。fixed で場所を取らないので、
	// 足さないとページの終わりがプレイヤーの裏に隠れる（余白は globals.css 側）
	useEffect(() => {
		if (!isVisible) return;
		document.body.dataset.miniPlayer = "on";
		return () => {
			document.body.removeAttribute("data-mini-player");
		};
	}, [isVisible]);

	if (!track || !isVisible) return null;

	return (
		// モバイルはナビが画面下にあるので、その上に重ねる。md以上はナビが上に移るため画面下へ置く
		<div className=" fixed inset-x-0 bottom-16 md:bottom-4 z-20 px-4 pointer-events-none ">
			<section
				aria-label="再生中の曲"
				className=" pointer-events-auto mx-auto max-w-3xl flex items-center gap-3 p-3
							rounded-2xl border bg-[var(--surface)]/95 backdrop-blur shadow-lg "
			>
				<Link
					href={`/works/${track.slug}`}
					className=" relative shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-neutral-200 "
					aria-label={`${track.title} のページへ戻る`}
				>
					{track.artwork ? (
						<Image src={track.artwork} alt="" fill className=" object-cover " />
					) : (
						<span className=" absolute inset-0 grid place-items-center text-neutral-400 ">
							<NoteIcon className=" w-6 h-6 " />
						</span>
					)}
				</Link>

				<div className=" flex-1 min-w-0 space-y-1 ">
					<div className=" flex items-baseline gap-2 min-w-0 ">
						{/* 曲名は1行に収める。長い題名でバーの幅が押し出されないようにする */}
						<Link
							href={`/works/${track.slug}`}
							className=" truncate text-sm text-blue-600 hover:underline "
						>
							{track.title}
						</Link>
						{/* 曲名を詰めすぎないよう、狭い画面では今の位置だけ出して曲の長さは省く */}
						<span className=" shrink-0 text-[11px] text-neutral-500 tabular-nums ">
							{formatTime(player.currentTime)}
							{hasDuration(player.duration) && (
								<span className=" hidden sm:inline "> / {formatTime(player.duration)}</span>
							)}
						</span>
					</div>
					<SeekBar
						currentTime={player.currentTime}
						duration={player.duration}
						onSeek={player.seek}
						thin
					/>
				</div>

				<PlayPauseButton
					title={track.title}
					isPlaying={player.isPlaying}
					isWaiting={player.isWaiting}
					onClick={() => (player.isPlaying ? player.pause() : player.play(track))}
					className=" w-10 h-10 "
				/>

				<button
					type="button"
					onClick={player.stop}
					aria-label="再生をやめて閉じる"
					className=" shrink-0 grid place-items-center w-8 h-8 rounded-full
								text-neutral-500 hover:bg-neutral-100 transition cursor-pointer "
				>
					<CloseIcon />
				</button>
			</section>
		</div>
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
