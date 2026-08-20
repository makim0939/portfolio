"use client";

/*
	コンタクトのフォームで送ったとき、封筒がポストに吸い込まれる演出（Issue #75）。

	フォームの飾りとして扱う。ここが読み込めなくても、動かなくても、送信そのものは
	成立する。だからページ側は dynamic で後から差し込み、入力欄は最初から使える。

	演出は送信を押した瞬間に始めるが、「届きました」の表示は通信の返事を待つ。
	演出だけで完了を名乗ると、送れていないのに投函できた絵を見せることになる。
*/

import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { useTimeOfDay } from "@/hooks/useTimeOfDay";
import {
	ENVELOPE_REST,
	ENVELOPE_SIZE,
	POST_GLB,
	RETURN_TIMELINE,
	SLOT_MOUTH,
	TIMELINE,
	damped,
	easeInOut,
	easeOut,
	progress,
} from "@/lib/contactPost";
import { SCENE_LIGHTING } from "@/lib/timeOfDay";
import { useGLTF } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useEffect, useRef } from "react";
import type * as THREE from "three";

/** 送信の進み具合。フォーム側の状態をそのまま受ける */
export type PostPhase = "idle" | "posting" | "sent" | "returning";

type PostNodes = {
	nodes: Record<string, THREE.Mesh>;
	materials: Record<string, THREE.Material>;
};

function Envelope() {
	const { width, height, thickness } = ENVELOPE_SIZE;
	return (
		<group>
			<mesh castShadow={false}>
				<boxGeometry args={[width, height, thickness]} />
				<meshStandardMaterial color="#f6f4ef" roughness={0.7} />
			</mesh>
			{/* ふたの折り目。白い板のままだと、小さく出したとき紙に見えない */}
			<mesh position={[0, height * 0.22, thickness / 2 + 0.0006]}>
				<boxGeometry args={[width * 0.98, height * 0.3, 0.0006]} />
				<meshStandardMaterial color="#ddd8cd" roughness={0.8} />
			</mesh>
		</group>
	);
}

type SceneProps = {
	phase: PostPhase;
	reduced: boolean;
	/** モデルが揃って演出を出せるようになったことを知らせる */
	onReady: () => void;
};

function PostScene({ phase, reduced, onReady }: SceneProps) {
	const { nodes, materials } = useGLTF(POST_GLB) as unknown as PostNodes;
	const timeOfDay = useTimeOfDay();
	const lighting = SCENE_LIGHTING[timeOfDay];

	const post = useRef<THREE.Group>(null);
	const flap = useRef<THREE.Object3D>(null);
	const envelope = useRef<THREE.Group>(null);
	/** 今の phase に入った時刻。null なら、まだ1フレームも描いていない */
	const startedAt = useRef<number | null>(null);

	// biome-ignore lint/correctness/useExhaustiveDependencies: phase が変わるたびに測り直す
	useEffect(() => {
		startedAt.current = null;
	}, [phase]);

	// useGLTF は読み終わるまで suspend するので、ここまで来たら出せる
	useEffect(() => {
		onReady();
	}, [onReady]);

	useFrame(() => {
		if (!envelope.current || !flap.current || !post.current) return;

		if (startedAt.current === null) startedAt.current = performance.now();
		const elapsed = (performance.now() - startedAt.current) / 1000;

		const rest = ENVELOPE_REST;
		const mouth = SLOT_MOUTH;

		if (reduced || phase === "idle" || phase === "sent") {
			flap.current.rotation.x = 0;
			post.current.rotation.z = 0;
			envelope.current.visible = phase !== "sent";
			// 待っている間はゆっくり上下させて、触れるものだと分かるようにする
			const bob = reduced ? 0 : Math.sin(elapsed * 1.6) * 0.012;
			envelope.current.position.set(rest[0], rest[1] + bob, rest[2]);
			envelope.current.rotation.set(0, 0, reduced ? 0 : Math.sin(elapsed * 1.1) * 0.06);
			envelope.current.scale.setScalar(1);
			return;
		}

		if (phase === "posting") {
			const fly = easeInOut(progress(elapsed, TIMELINE.fly));
			const swallow = easeOut(progress(elapsed, TIMELINE.swallow));
			const open = easeOut(progress(elapsed, TIMELINE.flapOpen));
			const close = easeInOut(progress(elapsed, TIMELINE.flapClose));

			// 投函口へ寄りながら、封筒を寝かせる。横長の口には平らにしないと入らない
			envelope.current.position.set(
				rest[0] + (mouth[0] - rest[0]) * fly,
				rest[1] + (mouth[1] - rest[1]) * fly + Math.sin(fly * Math.PI) * 0.06,
				rest[2] + (mouth[2] - rest[2]) * fly - swallow * 0.22,
			);
			envelope.current.rotation.set(-(Math.PI / 2) * fly, 0, 0);
			envelope.current.scale.setScalar(1 - swallow * 0.35);
			envelope.current.visible = swallow < 1;

			flap.current.rotation.x = (open - close) * 1.0;
			post.current.rotation.z = damped(progress(elapsed, TIMELINE.shake)) * 0.022;
			return;
		}

		// 送信に失敗したので、封筒を出して返す
		const fly = easeInOut(progress(elapsed, RETURN_TIMELINE.fly));
		const open = easeOut(progress(elapsed, RETURN_TIMELINE.flapOpen));
		const close = easeInOut(progress(elapsed, RETURN_TIMELINE.flapClose));

		envelope.current.visible = true;
		envelope.current.position.set(
			mouth[0] + (rest[0] - mouth[0]) * fly,
			mouth[1] + (rest[1] - mouth[1]) * fly + Math.sin(fly * Math.PI) * 0.05,
			mouth[2] + (rest[2] - mouth[2]) * fly,
		);
		envelope.current.rotation.set(-(Math.PI / 2) * (1 - fly), 0, 0);
		envelope.current.scale.setScalar(0.65 + 0.35 * fly);
		flap.current.rotation.x = (open - close) * 1.0;
		post.current.rotation.z = 0;
	});

	return (
		<>
			{/*
				時間帯からは色だけ借りて、明るさは固定にする。部屋と同じ強さにすると
				夜がほぼ真っ暗になるが、ここは明るいページの上に置く部品なので、
				何時に来ても同じように読めないと困る。
			*/}
			<ambientLight color={lighting.ambientColor} intensity={1.15} />
			<directionalLight color={lighting.sunColor} intensity={1.7} position={[2.2, 3.4, 2.6]} />
			{/* 正面が暗く沈まないよう、カメラ側から弱く当てる */}
			<directionalLight color={lighting.ambientColor} intensity={0.7} position={[-1.5, 1.2, 3]} />

			<group ref={post} position={[0, -0.62, 0]}>
				<mesh geometry={nodes.PostBody.geometry} material={materials.PostBody} />
				<mesh geometry={nodes.PostCap.geometry} material={materials.PostBody} />
				<mesh geometry={nodes.PostBase.geometry} material={materials.PostDoor} />
				<mesh geometry={nodes.PostDoor.geometry} material={materials.PostDoor} />
				<mesh geometry={nodes.PostSlot.geometry} material={materials.PostSlot} />
				<mesh geometry={nodes.PostMark.geometry} material={materials.PostMark} />
				{/*
					ふたは投函口の上辺に原点を置いて書き出してあるので、X まわりに
					回すだけで開く。位置は glb の値をそのまま使う。
				*/}
				<mesh
					ref={flap}
					geometry={nodes.PostFlap.geometry}
					material={materials.PostDoor}
					position={nodes.PostFlap.position}
				/>
				<group ref={envelope}>
					<Envelope />
				</group>
			</group>
		</>
	);
}

type ContactPostProps = {
	phase: PostPhase;
	onReady: () => void;
};

export function ContactPost({ phase, onReady }: ContactPostProps) {
	const reduced = usePrefersReducedMotion();

	/*
		ズームは「1メートルあたりのピクセル数」。器の高さを変えたら見える範囲も
		変わるので、ポストの高さ（約1.2m）が収まる値にしてある。
	*/
	return (
		<div className=" h-40 md:h-48 " aria-hidden="true">
			<Canvas
				orthographic
				camera={{ position: [1.5, 1.1, 3.4], zoom: 120, near: 0.1, far: 20 }}
				gl={{ antialias: true, alpha: true }}
				dpr={[1, 2]}
			>
				<Suspense fallback={null}>
					<PostScene phase={phase} reduced={reduced} onReady={onReady} />
				</Suspense>
			</Canvas>
		</div>
	);
}

useGLTF.preload(POST_GLB);

export default ContactPost;
