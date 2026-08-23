"use client";

import { AUTHOR_NAME } from "@/lib/site";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";

/** いま載せている曲。作品ページに戻れるように slug も持つ */
export type AudioTrack = {
	slug: string;
	title: string;
	src: string;
	artwork?: string;
};

type AudioPlayerValue = {
	/** 載せている曲。止めていても、降ろすまでは残る */
	track?: AudioTrack;
	isPlaying: boolean;
	isWaiting: boolean;
	currentTime: number;
	duration: number;
	/** 同じ曲なら続きから、違う曲なら差し替えて鳴らす */
	play: (track: AudioTrack) => void;
	pause: () => void;
	seek: (seconds: number) => void;
	/** 曲を降ろす。ミニプレイヤーの「閉じる」 */
	stop: () => void;
};

const AudioPlayerContext = createContext<AudioPlayerValue | undefined>(undefined);

export function useAudioPlayer(): AudioPlayerValue {
	const value = useContext(AudioPlayerContext);
	if (!value) throw new Error("useAudioPlayer は AudioPlayerProvider の中で使う");
	return value;
}

/**
 * サイト全体でひとつだけ音を鳴らす入れ物。
 *
 * `<audio>` を作品ページの中に置くと、ページを移った時点で要素ごと消えて音が切れる。
 * 曲を聴きながら他のページを見に行けるように、ルートレイアウトに置いたここが
 * `<audio>` を持ち、各ページのプレイヤーは状態を映すだけにしている。
 *
 * 続くのはサイト内のリンクでの移動だけで、再読み込みでは切れる。ページを跨いで
 * 音を持ち越す手立てがブラウザに無いため。
 */
export function AudioPlayerProvider({ children }: { children: React.ReactNode }) {
	const audioRef = useRef<HTMLAudioElement>(null);
	const [track, setTrack] = useState<AudioTrack>();
	const [isPlaying, setIsPlaying] = useState(false);
	const [isWaiting, setIsWaiting] = useState(false);
	const [currentTime, setCurrentTime] = useState(0);
	// 読み込む前は長さが分からない。分かるまでは NaN のままにして --:-- と出す
	const [duration, setDuration] = useState(Number.NaN);
	// 押した流れの中で今の曲と見比べるため、state とは別に ref でも持つ
	const trackRef = useRef<AudioTrack | undefined>(undefined);

	const play = useCallback((next: AudioTrack) => {
		const audio = audioRef.current;
		if (!audio) return;

		// 曲が変わるときは、state の更新を待たずに要素へ直接差し替える。
		// setState を挟むと押した操作と再生が別の処理に分かれ、Safari に自動再生と
		// みなされて止められるため
		if (trackRef.current?.slug !== next.slug) {
			trackRef.current = next;
			audio.src = next.src;
			setTrack(next);
			setCurrentTime(0);
			setDuration(Number.NaN);
		}
		// 押してから鳴り出すまで間があるので、待っていることを見せる
		setIsWaiting(true);
		audio.play().catch(() => setIsWaiting(false));
	}, []);

	const pause = useCallback(() => {
		audioRef.current?.pause();
	}, []);

	const seek = useCallback((seconds: number) => {
		const audio = audioRef.current;
		if (!audio) return;
		audio.currentTime = seconds;
		// timeupdate を待つと、つまんで動かしている間つまみが戻って見える
		setCurrentTime(seconds);
	}, []);

	const stop = useCallback(() => {
		const audio = audioRef.current;
		if (audio) {
			audio.pause();
			// 読み込みも止める。src を空にしただけでは続きを取りに行くことがある
			audio.removeAttribute("src");
			audio.load();
		}
		trackRef.current = undefined;
		setTrack(undefined);
		setIsPlaying(false);
		setIsWaiting(false);
		setCurrentTime(0);
		setDuration(Number.NaN);
	}, []);

	// ロック画面やコントロールセンターに曲を出す。イヤホンの再生ボタンもここで受ける
	useEffect(() => {
		if (!("mediaSession" in navigator)) return;

		if (!track) {
			navigator.mediaSession.metadata = null;
			return;
		}

		navigator.mediaSession.metadata = new MediaMetadata({
			title: track.title,
			artist: AUTHOR_NAME,
			artwork: track.artwork ? [{ src: track.artwork }] : undefined,
		});
		navigator.mediaSession.setActionHandler("play", () => {
			audioRef.current?.play().catch(() => {});
		});
		navigator.mediaSession.setActionHandler("pause", () => audioRef.current?.pause());

		return () => {
			navigator.mediaSession.setActionHandler("play", null);
			navigator.mediaSession.setActionHandler("pause", null);
		};
	}, [track]);

	// 鳴っているかどうかもOSに伝える。伝えないとロック画面のボタンが
	// 再生と一時停止のどちらの形で出るか定まらない
	useEffect(() => {
		if (!("mediaSession" in navigator)) return;
		navigator.mediaSession.playbackState = !track ? "none" : isPlaying ? "playing" : "paused";
	}, [track, isPlaying]);

	const value = useMemo(
		() => ({ track, isPlaying, isWaiting, currentTime, duration, play, pause, seek, stop }),
		[track, isPlaying, isWaiting, currentTime, duration, play, pause, seek, stop],
	);

	return (
		<AudioPlayerContext.Provider value={value}>
			{children}
			{/* biome-ignore lint/a11y/useMediaCaption: 曲そのものが作品で、歌詞の字幕データを持っていないため */}
			<audio
				ref={audioRef}
				// 音源は数MBあるので、押されるまで読み込まない
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
			/>
		</AudioPlayerContext.Provider>
	);
}
