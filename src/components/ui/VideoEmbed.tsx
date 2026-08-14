"use client";

import Image from "next/image";
import { useState } from "react";

type VideoEmbedProps = {
	title: string;
	youtubeId?: string;
	thumbnail?: string;
};

/**
 * 再生ボタンを押すまでYouTubeのプレイヤーを読み込まない。
 * 埋め込みを置いただけでプレイヤーの一式（数百KB）が読み込まれ、
 * 見るとは限らない動画のために表示が重くなるのを避けるため。
 */
export function VideoEmbed({ title, youtubeId, thumbnail }: VideoEmbedProps) {
	const [isPlaying, setIsPlaying] = useState(false);

	if (!youtubeId) return null;

	if (isPlaying) {
		return (
			<iframe
				src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1`}
				title={title}
				allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
				allowFullScreen
				className=" w-full aspect-video rounded-2xl border-0 bg-neutral-900 "
			/>
		);
	}

	return (
		<button
			type="button"
			onClick={() => setIsPlaying(true)}
			aria-label={`${title} を再生する`}
			className=" group relative w-full aspect-video rounded-2xl overflow-hidden bg-neutral-900 "
		>
			{thumbnail && (
				<Image
					src={thumbnail}
					alt=""
					width={1280}
					height={720}
					className=" absolute inset-0 w-full h-full object-cover "
				/>
			)}
			<span
				className=" absolute inset-0 flex items-center justify-center bg-black/20
							group-hover:bg-black/30 transition "
			>
				<PlayBadge />
			</span>
		</button>
	);
}

export function PlayBadge({ className = "" }: { className?: string }) {
	return (
		<span
			className={` flex items-center justify-center w-16 h-16 rounded-full
						bg-black/60 text-neutral-50 ${className} `}
		>
			<svg width="24" height="24" viewBox="0 0 24 24" role="img" aria-label="再生">
				<path d="M8 5.5 L19 12 L8 18.5 Z" fill="currentColor" />
			</svg>
		</span>
	);
}
