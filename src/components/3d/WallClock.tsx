"use client";
/*
モデルのソース: 3DCG/Objects/WallClock (WallClock.py -> WallClock.glb)

針は 12 時を指した状態で作ってあり、オブジェクトの原点は文字盤の中心にある。
そのため Z 軸まわりに回すだけで実時刻を指す。
*/

import { useGLTF } from "@react-three/drei";
import { type JSX, useEffect, useState } from "react";
import type * as THREE from "three";
import type { GLTF } from "three/examples/jsm/Addons.js";

type GLTFResult = GLTF & {
	nodes: {
		ClockCase: THREE.Mesh;
		ClockFace: THREE.Mesh;
		ClockMarks: THREE.Mesh;
		ClockHourHand: THREE.Mesh;
		ClockMinuteHand: THREE.Mesh;
	};
	materials: {
		ClockCase: THREE.MeshStandardMaterial;
		ClockFace: THREE.MeshStandardMaterial;
		ClockHand: THREE.MeshStandardMaterial;
	};
};

/**
 * 棚の上の壁（内側の面が z = -1.388）に掛ける位置。モデルは +z を向いている。
 * 壁の中央だと掛ける必然性がなく浮いて見えるため、棚と観葉植物の真上に寄せて
 * 家具のまとまりの一部として見えるようにしている。
 * 棚の天板は y = 0.90、植物の先端は y = 1.33 なので、下端 y = 1.465 で干渉しない。
 */
const WALL_POSITION: [number, number, number] = [-0.9, 1.62, -1.36];

/** 分針は 1 分で 6 度しか動かないので、この間隔で十分追従する。 */
const TICK_INTERVAL_MS = 15_000;

type HandAngles = { hour: number; minute: number };

function handAngles(date: Date): HandAngles {
	const minutes = date.getMinutes();
	return {
		hour: (((date.getHours() % 12) + minutes / 60) / 12) * Math.PI * 2,
		minute: (minutes / 60) * Math.PI * 2,
	};
}

/**
 * 実時刻から針の角度を返す。サーバ側では時刻が確定しないので 0 時を返すが、
 * この値は DOM に出ない（3Dの見た目にしか効かない）のでハイドレーションの
 * ずれにはならない。
 */
function useHandAngles(): HandAngles {
	const [angles, setAngles] = useState<HandAngles>(() =>
		typeof window === "undefined" ? { hour: 0, minute: 0 } : handAngles(new Date()),
	);

	useEffect(() => {
		const update = () => setAngles(handAngles(new Date()));
		update();
		const id = setInterval(update, TICK_INTERVAL_MS);
		return () => clearInterval(id);
	}, []);

	return angles;
}

export function WallClock(props: JSX.IntrinsicElements["group"]) {
	const { nodes, materials } = useGLTF("/wall_clock.glb") as unknown as GLTFResult;
	const angles = useHandAngles();

	return (
		<group position={WALL_POSITION} {...props} dispose={null}>
			<mesh
				castShadow
				receiveShadow
				geometry={nodes.ClockCase.geometry}
				material={materials.ClockCase}
			/>
			<mesh
				castShadow
				receiveShadow
				geometry={nodes.ClockFace.geometry}
				material={materials.ClockFace}
			/>
			<mesh
				castShadow
				receiveShadow
				geometry={nodes.ClockMarks.geometry}
				material={materials.ClockHand}
			/>
			{/* 時計回りは Z 軸の負方向まわり。 */}
			<mesh
				castShadow
				receiveShadow
				geometry={nodes.ClockHourHand.geometry}
				material={materials.ClockHand}
				rotation={[0, 0, -angles.hour]}
			/>
			<mesh
				castShadow
				receiveShadow
				geometry={nodes.ClockMinuteHand.geometry}
				material={materials.ClockHand}
				rotation={[0, 0, -angles.minute]}
			/>
		</group>
	);
}

useGLTF.preload("/wall_clock.glb");
