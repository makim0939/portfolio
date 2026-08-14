/*
モデルのソース: 3DCG/Objects/RoomWalls (RoomWalls.py -> RoomWalls.glb)

portfolio_room_1_1.glb に含まれる `Wall` メッシュの置き換え。窓が本物の開口になって
いるので、Scene.tsx の directionalLight が偽のハイライトではなく、実際に窓型の光を
床に落とす。
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

type RoomWallsProps = JSX.IntrinsicElements["group"] & {
	/** 窓の外の板の色。時間帯で差し替える。 */
	skyColor: string;
	skyEmissive: string;
};

export function RoomWalls({ skyColor, skyEmissive, ...props }: RoomWallsProps) {
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
				窓の向こう側に置いてあるだけの板。castShadow を付けると太陽と窓の間に
				入って光を遮ってしまうので付けない。GLB の materials.WindowSky を使わず
				ここでマテリアルを与えているのは、GLB 側は共有インスタンスで、時間帯ごとに
				色を書き換えると他の用途にも波及してしまうため。
			*/}
			<mesh geometry={nodes.WindowSky.geometry} position={[1.755, 1.525, 0.125]}>
				<meshStandardMaterial color={skyColor} emissive={skyEmissive} roughness={1} />
			</mesh>
		</group>
	);
}

useGLTF.preload("/room_walls.glb");
