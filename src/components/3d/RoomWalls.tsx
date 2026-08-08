/*
Source: 3DCG/Objects/RoomWalls (RoomWalls.py -> RoomWalls.glb)

Replaces the `Wall` mesh that ships inside portfolio_room_1_1.glb. Same
silhouette, but with a real opening cut through the x = 1.387 wall and the
z = -1.388 face painted green.

The opening is a genuine hole, so the directional light in Scene.tsx casts a
window-shaped patch on the floor instead of a faked highlight.
*/

import { useGLTF } from "@react-three/drei";
import type { JSX } from "react";
import type * as THREE from "three";
import type { GLTF } from "three/examples/jsm/Addons.js";

type GLTFResult = GLTF & {
	nodes: {
		WallGreen: THREE.Mesh;
		WallWhite: THREE.Mesh;
		WindowFrame: THREE.Mesh;
		WindowSky: THREE.Mesh;
	};
	materials: {
		WallGreen: THREE.MeshStandardMaterial;
		WallWhite: THREE.MeshStandardMaterial;
		WindowFrame: THREE.MeshStandardMaterial;
		WindowSky: THREE.MeshStandardMaterial;
	};
};

export function RoomWalls(props: JSX.IntrinsicElements["group"]) {
	const { nodes, materials } = useGLTF("/room_walls.glb") as unknown as GLTFResult;
	return (
		<group {...props} dispose={null}>
			<mesh
				castShadow
				receiveShadow
				geometry={nodes.WallWhite.geometry}
				material={materials.WallWhite}
			/>
			<mesh
				castShadow
				receiveShadow
				geometry={nodes.WallGreen.geometry}
				material={materials.WallGreen}
			/>
			<mesh
				castShadow
				receiveShadow
				geometry={nodes.WindowFrame.geometry}
				material={materials.WindowFrame}
				position={[1.3795, 1.525, -0.535]}
			/>
			{/*
				白飛びした「外」。窓の向こう側に置いてあるだけの板で、
				castShadow を付けると太陽と窓の間に入って光を遮ってしまうので付けない。
			*/}
			<mesh
				geometry={nodes.WindowSky.geometry}
				material={materials.WindowSky}
				position={[1.755, 1.525, 0.125]}
			/>
		</group>
	);
}

useGLTF.preload("/room_walls.glb");
