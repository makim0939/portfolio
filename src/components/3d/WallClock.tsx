/*
Source: 3DCG/Objects/WallClock (WallClock.py -> WallClock.glb)
*/

import { useGLTF } from "@react-three/drei";
import type { JSX } from "react";
import type * as THREE from "three";
import type { GLTF } from "three/examples/jsm/Addons.js";

type GLTFResult = GLTF & {
	nodes: {
		ClockCase: THREE.Mesh;
		ClockFace: THREE.Mesh;
		ClockHands: THREE.Mesh;
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

export function WallClock(props: JSX.IntrinsicElements["group"]) {
	const { nodes, materials } = useGLTF("/wall_clock.glb") as unknown as GLTFResult;
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
				geometry={nodes.ClockHands.geometry}
				material={materials.ClockHand}
			/>
		</group>
	);
}

useGLTF.preload("/wall_clock.glb");
