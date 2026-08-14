"use client";

import { AvatarPrototype } from "@/components/3d/AvatarPrototype";
import { AVATAR_MOTION_CLIPS, type AvatarMotion, type ScenePlacement } from "@/lib/avatarMotion";
import {
	AVATAR_BASE_SIZE,
	type AvatarLayout,
	type BonePose,
	type PhotoLayout,
	THUMBNAIL_SIZE,
	type ThumbnailDesign,
} from "@/lib/thumbnailDesign";
import { TransformControls, useGLTF } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useRef, useState } from "react";
import type * as THREE from "three";

/** サイトの地色・文字色に合わせた値 */
const BACKGROUND = "linear-gradient(135deg, #fffdf8 0%, #fdf1e7 100%)";
const ACCENT_COLOR = "#dd5522";
const TEXT_COLOR = "#252528";
const SUB_TEXT_COLOR = "#757578";
const PAPER_COLOR = "#fffdf8";

/**
 * サムネイルでの立ち位置。
 * 既定の値は部屋のどこに立つかを表したもので、モーションごとに散らばっている。
 * ここは部屋ではないので、どのモーションでも同じ場所に立ってもらう。
 */
const PORTRAIT_PLACEMENT: ScenePlacement = { position: [0, 0, 0], rotation: [0, -Math.PI / 4, 0] };

/** 撮影の合図を出すまでに描くフレーム数。1枚目は絵が出そろっていないことがある */
const FRAMES_BEFORE_READY = 3;

/** 指の骨まで並べると選びきれないので、一覧からは外す */
const FINGER_BONE_PATTERN = /Thumb|Index|Middle|Ring|Pinky/;

/** 枠を掴む四角の大きさ */
const HANDLE_SIZE = 16;

declare global {
	interface Window {
		/** 撮影スクリプトが待つ合図。絵が出そろったら true になる */
		__thumbnailReady?: boolean;
	}
}

/**
 * つまんで動かす。
 * 押した位置からの差分を渡すので、受け取った側が何を動かすかを決める。
 */
function startDrag(
	event: React.PointerEvent,
	onMove: (deltaX: number, deltaY: number) => void,
): void {
	event.preventDefault();
	event.stopPropagation();
	const startX = event.clientX;
	const startY = event.clientY;

	const move = (e: PointerEvent) => onMove(e.clientX - startX, e.clientY - startY);
	const up = () => {
		window.removeEventListener("pointermove", move);
		window.removeEventListener("pointerup", up);
	};
	window.addEventListener("pointermove", move);
	window.addEventListener("pointerup", up);
}

/** 枠の右下に出す、大きさを変えるためのつまみ */
function ResizeHandle({ onDrag }: { onDrag: (event: React.PointerEvent) => void }) {
	return (
		<div
			onPointerDown={onDrag}
			style={{
				position: "absolute",
				right: -HANDLE_SIZE / 2,
				bottom: -HANDLE_SIZE / 2,
				width: HANDLE_SIZE,
				height: HANDLE_SIZE,
				borderRadius: 4,
				backgroundColor: PAPER_COLOR,
				border: `2px solid ${ACCENT_COLOR}`,
				cursor: "nwse-resize",
				pointerEvents: "auto",
			}}
		/>
	);
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

type PoseEditorProps = {
	pose: BonePose;
	selectedBone: string;
	/**
	 * いま止めている姿勢の目印。モーションや止める時刻が変わって値が変わったら、
	 * そのときの姿勢を新しい基準として撮り直す。
	 */
	resetKey: string;
	onBonesFound: (names: string[]) => void;
	onBoneRotated: (name: string, rotation: [number, number, number]) => void;
};

/**
 * 骨を直に回してポーズを作る。
 *
 * 上書き中は毎フレーム書き込んで、手で回した分をモーションの上に残す。
 *
 * 上書きをやめたときは、モーション側が書き戻してくれることを当てにできない。
 * three.js のミキサーには「前フレームと値が変わらなければ書き込みを省く」
 * 最適化があり、ポーズを止めた直後の数フレームで書き込みが止まるため。
 * そのため止めた直後の姿勢を自分たちで控えておき、上書きが外れた骨には
 * その姿勢を書き戻す。
 */
function PoseEditor({
	pose,
	selectedBone,
	resetKey,
	onBonesFound,
	onBoneRotated,
}: PoseEditorProps) {
	const scene = useThree((state) => state.scene);
	const bones = useRef(new Map<string, THREE.Bone>());
	const baseline = useRef(new Map<string, THREE.Quaternion>());
	const previousPose = useRef<BonePose>({});
	const [selected, setSelected] = useState<THREE.Bone | null>(null);

	useEffect(() => {
		const found = new Map<string, THREE.Bone>();
		scene.traverse((object) => {
			const bone = object as THREE.Bone;
			if (bone.isBone && !FINGER_BONE_PATTERN.test(bone.name)) found.set(bone.name, bone);
		});
		bones.current = found;
		onBonesFound(Array.from(found.keys()));
	}, [scene, onBonesFound]);

	useEffect(() => {
		setSelected(bones.current.get(selectedBone) ?? null);
	}, [selectedBone]);

	// 基準の姿勢が変わったので、控えを撮り直す（次の useFrame で撮り直される）
	// biome-ignore lint/correctness/useExhaustiveDependencies: resetKey は値ではなく、変わったことだけを合図に使う
	useEffect(() => {
		baseline.current.clear();
	}, [resetKey]);

	// 上書きが外れた骨（=戻された骨）には、控えておいた姿勢を書き戻す
	useEffect(() => {
		for (const name of Object.keys(previousPose.current)) {
			if (name in pose) continue;
			const bone = bones.current.get(name);
			const base = baseline.current.get(name);
			if (bone && base) bone.quaternion.copy(base);
		}
		previousPose.current = pose;
	}, [pose]);

	useFrame(() => {
		for (const [name, bone] of bones.current) {
			const rotation = pose[name];
			if (rotation) {
				bone.rotation.set(rotation[0], rotation[1], rotation[2]);
			} else if (!baseline.current.has(name)) {
				baseline.current.set(name, bone.quaternion.clone());
			}
		}
	});

	if (!selected) return null;

	return (
		<TransformControls
			object={selected}
			mode="rotate"
			/*
				骨そのものの向きで回す。アバターは親側で回転と縮小がかかっているので、
				世界の向きで回すと、つまんだ輪と骨の動きが噛み合わない。
				上書きも骨のローカルの角度で持っているので、こちらで揃う。
			*/
			space="local"
			size={0.9}
			onObjectChange={() =>
				onBoneRotated(selectedBone, [selected.rotation.x, selected.rotation.y, selected.rotation.z])
			}
		/>
	);
}

type ThumbnailPreviewProps = {
	design: ThumbnailDesign;
	selectedBone: string;
	/** 撮影中。つまみや枠線を出すと画像に写ってしまうので隠す */
	capture: boolean;
	onMeasureDuration: (seconds: number) => void;
	onBonesFound: (names: string[]) => void;
	onBoneRotated: (name: string, rotation: [number, number, number]) => void;
	onPhotoLayoutChange: (layout: PhotoLayout) => void;
	onAvatarLayoutChange: (layout: AvatarLayout) => void;
};

export function ThumbnailPreview({
	design,
	selectedBone,
	capture,
	onMeasureDuration,
	onBonesFound,
	onBoneRotated,
	onPhotoLayoutChange,
	onAvatarLayoutChange,
}: ThumbnailPreviewProps) {
	const { photoLayout, avatarLayout } = design;
	const avatarWidth = AVATAR_BASE_SIZE.width * avatarLayout.scale;
	const avatarHeight = AVATAR_BASE_SIZE.height * avatarLayout.scale;

	/*
		骨をいじっているあいだだけ、アバターの枠で受け取る。
		出しっぱなしにすると、枠が重なったところで写真をつまめなくなる。
	*/
	const avatarTakesPointer = !capture && Boolean(selectedBone);

	return (
		<div
			id="thumbnail"
			style={{
				position: "relative",
				width: THUMBNAIL_SIZE.width,
				height: THUMBNAIL_SIZE.height,
				overflow: "hidden",
				backgroundColor: PAPER_COLOR,
				backgroundImage: BACKGROUND,
			}}
		>
			{design.photo && (
				// 枠ごと傾ける。つまみも一緒に傾いて、辺と向きが揃う
				<div
					style={{
						position: "absolute",
						left: photoLayout.x,
						top: photoLayout.y,
						width: photoLayout.width,
						height: photoLayout.height,
						zIndex: photoLayout.inFront ? 2 : 0,
						transform: `rotate(${photoLayout.rotation}deg)`,
					}}
				>
					<img
						src={design.photo}
						alt=""
						draggable={false}
						onPointerDown={(event) =>
							!capture &&
							startDrag(event, (dx, dy) =>
								onPhotoLayoutChange({
									...photoLayout,
									x: Math.round(photoLayout.x + dx),
									y: Math.round(photoLayout.y + dy),
								}),
							)
						}
						style={{
							width: "100%",
							height: "100%",
							objectFit: "cover",
							// 枠から溢れた分をどこで切るか。数字が小さいほど左・上が残る
							objectPosition: `${photoLayout.trimX}% ${photoLayout.trimY}%`,
							borderRadius: 24,
							boxShadow: "0 18px 40px rgba(37,37,40,0.18)",
							cursor: capture ? "default" : "move",
						}}
					/>
					{!capture && (
						<ResizeHandle
							onDrag={(event) =>
								startDrag(event, (dx, dy) =>
									onPhotoLayoutChange({
										...photoLayout,
										width: Math.max(40, Math.round(photoLayout.width + dx)),
										height: Math.max(40, Math.round(photoLayout.height + dy)),
									}),
								)
							}
						/>
					)}
				</div>
			)}

			{/* アバター。枠ごと動かして拡げる。枠を大きくすればアバターも大きくなり、
				サムネイルから溢れた分は切り落とされる。
				手を上げるポーズがあるので、基準の枠は縦を全部使ってカメラも引いてある。 */}
			<div
				style={{
					position: "absolute",
					left: avatarLayout.x,
					top: avatarLayout.y,
					width: avatarWidth,
					height: avatarHeight,
					zIndex: 1,
					pointerEvents: avatarTakesPointer ? "auto" : "none",
					outline: capture ? undefined : "1px dashed rgba(221,85,34,0.4)",
				}}
			>
				{/* dpr を上げて、書き出したときに輪郭がざらつかないようにする */}
				<Canvas camera={{ position: [0.9, 0.65, 3.9], fov: 32 }} dpr={2}>
					<Suspense fallback={null}>
						<ambientLight color="#fff6ea" intensity={2.4} />
						<directionalLight position={[2, 4, 3]} intensity={2.6} color="#fff3e2" />
						<directionalLight position={[-3, 2, -2]} intensity={0.9} color="#e8f0ff" />
						<group position={[0, -0.85, 0]} rotation={[0, Math.PI / 2, 0]}>
							<AvatarPrototype
								motion={design.motion}
								frozenTime={design.time}
								placement={PORTRAIT_PLACEMENT}
							/>
						</group>
						<PoseEditor
							pose={design.pose}
							selectedBone={selectedBone}
							resetKey={`${design.motion}:${design.time}`}
							onBonesFound={onBonesFound}
							onBoneRotated={onBoneRotated}
						/>
						<ClipDurationProbe motion={design.motion} onMeasure={onMeasureDuration} />
						<CaptureReadySignal />
					</Suspense>
				</Canvas>

				{/* 枠自体は素通しにしてあるので、つまむところだけ受け取る */}
				{!capture && (
					<>
						<div
							onPointerDown={(event) =>
								startDrag(event, (dx, dy) =>
									onAvatarLayoutChange({
										...avatarLayout,
										x: Math.round(avatarLayout.x + dx),
										y: Math.round(avatarLayout.y + dy),
									}),
								)
							}
							style={{
								position: "absolute",
								left: 0,
								top: 0,
								padding: "2px 8px",
								borderRadius: "0 0 6px 0",
								backgroundColor: ACCENT_COLOR,
								color: PAPER_COLOR,
								fontSize: 11,
								cursor: "move",
								pointerEvents: "auto",
								userSelect: "none",
							}}
						>
							アバター
						</div>
						<ResizeHandle
							onDrag={(event) =>
								startDrag(event, (dx) =>
									onAvatarLayoutChange({
										...avatarLayout,
										scale:
											Math.round(Math.max(0.3, (avatarWidth + dx) / AVATAR_BASE_SIZE.width) * 100) /
											100,
									}),
								)
							}
						/>
					</>
				)}
			</div>

			{/* 文字の枠はアバターに重なるので、触っても素通りさせる。
				そうしないと、重なったところで骨の輪をつかめない */}
			<div
				style={{
					position: "absolute",
					left: 72,
					top: 168,
					width: 520,
					zIndex: 3,
					pointerEvents: "none",
				}}
			>
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
	);
}
