/*
モデルのソース: 3DCG/Objects/RoomWalls (RoomWalls.py -> RoomWalls.glb)

portfolio_room_1_1.glb に含まれる `Wall` メッシュの置き換え。シルエットは同じだが、
x = 1.387 の壁に本物の開口を貫通させ、z = -1.388 の面を緑に塗っている。

開口は本物の穴なので、Scene.tsx の directionalLight が偽のハイライトではなく、
実際に窓型の光を床に落とす。
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
