"use client";

import { AvatarPrototype } from "@/components/3d/AvatarPrototype";
import { AVATAR_MOTION_CLIPS, type AvatarMotion, type ScenePlacement } from "@/lib/avatarMotion";
import {
	type BonePose,
	type PhotoLayout,
	THUMBNAIL_SIZE,
	type ThumbnailDesign,
} from "@/lib/thumbnailDesign";
import { TransformControls, useGLTF } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
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

type PoseEditorProps = {
	pose: BonePose;
	selectedBone: string;
	onBonesFound: (names: string[]) => void;
	onBoneRotated: (name: string, rotation: [number, number, number]) => void;
};

/**
 * 骨を直に回してポーズを作る。
 *
 * モーションは毎フレーム骨に姿勢を書き込むので、その後ろから上書きしないと
 * 手で回した分がすぐ消える。この中の useFrame はアバターより後に登録されるため、
 * モーションが書いたあとに走る。
 */
function PoseEditor({ pose, selectedBone, onBonesFound, onBoneRotated }: PoseEditorProps) {
	const scene = useThree((state) => state.scene);
	const bones = useRef(new Map<string, THREE.Bone>());
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

	useFrame(() => {
		for (const [name, rotation] of Object.entries(pose)) {
			bones.current.get(name)?.rotation.set(rotation[0], rotation[1], rotation[2]);
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
	onMeasureDuration: (seconds: number) => void;
	onBonesFound: (names: string[]) => void;
	onBoneRotated: (name: string, rotation: [number, number, number]) => void;
	onPhotoMoved: (layout: PhotoLayout) => void;
};

export function ThumbnailPreview({
	design,
	selectedBone,
	onMeasureDuration,
	onBonesFound,
	onBoneRotated,
	onPhotoMoved,
}: ThumbnailPreviewProps) {
	const { photoLayout } = design;

	/** 写真はつまんで動かせる。数字を睨むより、置いてみるほうが早いので */
	const handlePhotoDrag = useCallback(
		(event: React.PointerEvent<HTMLImageElement>) => {
			event.preventDefault();
			const startX = event.clientX;
			const startY = event.clientY;
			const originX = photoLayout.x;
			const originY = photoLayout.y;

			const move = (e: PointerEvent) => {
				onPhotoMoved({
					...photoLayout,
					x: Math.round(originX + (e.clientX - startX)),
					y: Math.round(originY + (e.clientY - startY)),
				});
			};
			const up = () => {
				window.removeEventListener("pointermove", move);
				window.removeEventListener("pointerup", up);
			};
			window.addEventListener("pointermove", move);
			window.addEventListener("pointerup", up);
		},
		[photoLayout, onPhotoMoved],
	);

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
				<img
					src={design.photo}
					alt=""
					draggable={false}
					onPointerDown={handlePhotoDrag}
					style={{
						position: "absolute",
						left: photoLayout.x,
						top: photoLayout.y,
						width: photoLayout.width,
						height: photoLayout.height,
						zIndex: photoLayout.inFront ? 2 : 0,
						objectFit: "cover",
						transform: `rotate(${photoLayout.rotation}deg)`,
						borderRadius: 24,
						boxShadow: "0 18px 40px rgba(37,37,40,0.18)",
						cursor: "move",
					}}
				/>
			)}

			{/* アバター。手を上げるポーズがあるので、縦は全部使ってカメラも引いておく。
				ここが狭いと万歳したときに指先が切れる。

				骨を選んでいないあいだは触れないようにしておく。
				アバターの枠は写真と重なるので、出しっぱなしだと重なった部分で
				写真をつまめなくなる。 */}
			<div
				style={{
					position: "absolute",
					left: 500,
					top: 0,
					width: 380,
					height: 630,
					zIndex: 1,
					pointerEvents: selectedBone ? "auto" : "none",
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
							onBonesFound={onBonesFound}
							onBoneRotated={onBoneRotated}
						/>
						<ClipDurationProbe motion={design.motion} onMeasure={onMeasureDuration} />
						<CaptureReadySignal />
					</Suspense>
				</Canvas>
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
