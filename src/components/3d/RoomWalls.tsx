/*
部屋の壁。Room と同じ glb から描く。

窓の外の板だけ時間帯で色が変わるので、Room.tsx に混ぜず別コンポーネントにしてある。
useGLTF は同じパスなら読み込みを共有するので、glb が二重に落ちてくることはない。
*/

import { ROOM_GLB, type RoomGLTF } from "@/components/3d/Room";
import { useGLTF } from "@react-three/drei";
import type { JSX } from "react";

type RoomWallsProps = JSX.IntrinsicElements["group"] & {
	/** 窓の外の板の色。時間帯で差し替える。 */
	skyColor: string;
	skyEmissive: string;
};

export function RoomWalls({ skyColor, skyEmissive, ...props }: RoomWallsProps) {
	const { nodes, materials } = useGLTF(ROOM_GLB) as unknown as RoomGLTF;
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
				position={[1.379, 1.525, -0.535]}
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
