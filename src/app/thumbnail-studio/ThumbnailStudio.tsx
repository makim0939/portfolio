"use client";

import { AvatarPrototype } from "@/components/3d/AvatarPrototype";
import {
	AVATAR_MOTIONS,
	AVATAR_MOTION_CLIPS,
	type AvatarMotion,
	type ScenePlacement,
} from "@/lib/avatarMotion";
import {
	THUMBNAIL_SIZE,
	type ThumbnailDesign,
	parseThumbnailDesign,
	thumbnailDesignToQuery,
} from "@/lib/thumbnailDesign";
import { useGLTF } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useCallback, useEffect, useState } from "react";

/** サイトの地色・文字色に合わせた値 */
const BACKGROUND = "linear-gradient(135deg, #fffdf8 0%, #fdf1e7 100%)";
const ACCENT_COLOR = "#dd5522";
const TEXT_COLOR = "#252528";
const SUB_TEXT_COLOR = "#757578";
const PAPER_COLOR = "#fffdf8";

/** 写真を貼る枠。どんな比率の写真でも同じ大きさに収まるよう、切り抜いて合わせる */
const PHOTO_FRAME = { width: 392, height: 523 };

/**
 * サムネイルでの立ち位置。
 * 既定の値は部屋のどこに立つかを表したもので、モーションごとに散らばっている。
 * ここは部屋ではないので、どのモーションでも同じ場所に立ってもらう。
 */
const PORTRAIT_PLACEMENT: ScenePlacement = { position: [0, 0, 0], rotation: [0, -Math.PI / 4, 0] };

/** 撮影の合図を出すまでに描くフレーム数。1枚目は絵が出そろっていないことがある */
const FRAMES_BEFORE_READY = 3;

declare global {
	interface Window {
		/** 撮影スクリプトが待つ合図。絵が出そろったら true になる */
		__thumbnailReady?: boolean;
	}
}

/** 絵が出そろったことを撮影スクリプトに知らせる */
function CaptureReadySignal() {
	const [frames, setFrames] = useState(0);

	useFrame(() => setFrames((count) => (count < FRAMES_BEFORE_READY ? count + 1 : count)));

	useEffect(() => {
		if (frames >= FRAMES_BEFORE_READY) window.__thumbnailReady = true;
	}, [frames]);

	return null;
}

/** スライダーの右端をモーションの長さに合わせるために、クリップの秒数を測る */
function ClipDurationProbe({
	motion,
	onMeasure,
}: { motion: AvatarMotion; onMeasure: (seconds: number) => void }) {
	const { animations } = useGLTF("/avatar_prototype.glb");

	useEffect(() => {
		const clip = animations.find((a) => a.name === AVATAR_MOTION_CLIPS[motion]);
		if (clip) onMeasure(clip.duration);
	}, [animations, motion, onMeasure]);

	return null;
}

/** シェルにそのまま貼れる形にする */
function quoteForShell(value: string) {
	return `"${value.replace(/"/g, '\\"')}"`;
}

function buildCommand(design: ThumbnailDesign, slug: string) {
	const query = thumbnailDesignToQuery(design);
	const args = [
		["--slug", slug],
		["--title", query.get("title") ?? ""],
		["--subtitle", design.subtitle],
		["--label", design.label],
		["--photo", design.photo],
		["--motion", design.motion],
		["--time", design.time.toFixed(2)],
	].filter(([, value]) => value !== "");

	return `pnpm thumbnail ${args.map(([flag, value]) => `${flag} ${quoteForShell(value)}`).join(" ")}`;
}

export function ThumbnailStudio() {
	/*
		クエリはブラウザでしか読めないので、読み終えるまで何も描かない。
		先にサーバ側の既定値を描くと、文字が入れ替わってちらつくうえ、
		撮影の合図が入れ替わる前に出てしまう。
	*/
	const [design, setDesign] = useState<ThumbnailDesign | null>(null);
	const [slug, setSlug] = useState("");
	const [duration, setDuration] = useState(0);

	useEffect(() => {
		const params = new URLSearchParams(window.location.search);
		setDesign(parseThumbnailDesign(params));
		setSlug(params.get("slug") ?? "");
	}, []);

	const handleMeasure = useCallback((seconds: number) => setDuration(seconds), []);

	if (!design) return null;

	return (
		<>
			{/* 撮る範囲。ページの余白や下のナビを避けたいので、画面の左上に重ねて置く */}
			<div
				id="thumbnail"
				style={{
					position: "fixed",
					top: 0,
					left: 0,
					zIndex: 50,
					width: THUMBNAIL_SIZE.width,
					height: THUMBNAIL_SIZE.height,
					overflow: "hidden",
					backgroundColor: PAPER_COLOR,
					backgroundImage: BACKGROUND,
				}}
			>
				{design.photo && (
					<img
						src={design.photo}
						alt=""
						style={{
							position: "absolute",
							right: 56,
							top: 46,
							...PHOTO_FRAME,
							objectFit: "cover",
							transform: "rotate(2.5deg)",
							borderRadius: 24,
							boxShadow: "0 18px 40px rgba(37,37,40,0.18)",
						}}
					/>
				)}

				{/* アバター。手を上げるポーズがあるので、縦は全部使ってカメラも引いておく。
					ここが狭いと万歳したときに指先が切れる。 */}
				<div style={{ position: "absolute", left: 500, top: 0, width: 380, height: 630 }}>
					{/* dpr を上げて、書き出したときに輪郭がざらつかないようにする */}
					<Canvas camera={{ position: [0.9, 0.65, 3.9], fov: 32 }} dpr={2}>
						<Suspense fallback={null}>
							<ambientLight color="#fff6ea" intensity={2.4} />
							<directionalLight position={[2, 4, 3]} intensity={2.6} color="#fff3e2" />
							<directionalLight position={[-3, 2, -2]} intensity={0.9} color="#e8f0ff" />
							<group position={[0, -0.85, 0]} rotation={[0, Math.PI / 2, 0]}>
								<AvatarPrototype frozenTime={design.time} placement={PORTRAIT_PLACEMENT} />
							</group>
							<ClipDurationProbe motion={design.motion} onMeasure={handleMeasure} />
							<CaptureReadySignal />
						</Suspense>
					</Canvas>
				</div>

				<div style={{ position: "absolute", left: 72, top: 168, width: 520 }}>
					<div
						style={{
							display: "inline-block",
							padding: "6px 18px",
							borderRadius: 999,
							backgroundColor: ACCENT_COLOR,
							color: PAPER_COLOR,
							fontSize: 21,
							letterSpacing: "0.08em",
						}}
					>
						{design.label}
					</div>
					<div
						style={{
							marginTop: 26,
							fontSize: 48,
							fontWeight: 700,
							lineHeight: 1.4,
							letterSpacing: "0.02em",
							color: TEXT_COLOR,
						}}
					>
						{design.titleLines.map((line, index) => (
							// 題名は書いた順に並ぶだけで、入れ替わることがない
							// biome-ignore lint/suspicious/noArrayIndexKey: 並びが固定で、行に id 相当の値がないため
							<div key={index}>{line}</div>
						))}
					</div>
					<div
						style={{
							marginTop: 26,
							fontSize: 24,
							letterSpacing: "0.04em",
							color: SUB_TEXT_COLOR,
						}}
					>
						{design.subtitle}
					</div>
				</div>
			</div>

			{/* 操作するところ。撮る範囲の外なので画像には写らない */}
			<div
				style={{
					position: "fixed",
					top: THUMBNAIL_SIZE.height,
					left: 0,
					zIndex: 50,
					width: THUMBNAIL_SIZE.width,
					padding: 24,
					backgroundColor: "#ffffff",
					borderTop: "1px solid #e5e5e5",
					fontSize: 14,
					color: TEXT_COLOR,
				}}
			>
				<div style={{ display: "flex", alignItems: "center", gap: 16 }}>
					<label htmlFor="motion">モーション</label>
					<select
						id="motion"
						value={design.motion}
						onChange={(e) => setDesign({ ...design, motion: e.target.value as AvatarMotion })}
					>
						{AVATAR_MOTIONS.map((name) => (
							<option key={name} value={name}>
								{name}
							</option>
						))}
					</select>

					<label htmlFor="time">ポーズ</label>
					<input
						id="time"
						type="range"
						min={0}
						max={duration || 6}
						step={0.01}
						value={design.time}
						onChange={(e) => setDesign({ ...design, time: Number(e.target.value) })}
						style={{ flex: 1 }}
					/>
					<span style={{ fontVariantNumeric: "tabular-nums" }}>
						{design.time.toFixed(2)} / {(duration || 6).toFixed(2)}秒
					</span>
				</div>

				<p style={{ marginTop: 16, color: SUB_TEXT_COLOR }}>
					好みのポーズになったら、このまま下のコマンドで書き出せます。
				</p>
				<code
					style={{
						display: "block",
						marginTop: 8,
						padding: 12,
						borderRadius: 8,
						backgroundColor: "#f5f5f5",
						fontSize: 12,
						lineHeight: 1.7,
						wordBreak: "break-all",
					}}
				>
					{buildCommand(design, slug || "<記事のフォルダ名>")}
				</code>
			</div>
		</>
	);
}
