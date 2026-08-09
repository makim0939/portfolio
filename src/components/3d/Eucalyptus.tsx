/*
モデルのソース: 3DCG/Objects/Eucalyptus (Eucalyptus.py -> Eucalyptus.glb)

portfolio_room_1_1.glb に含まれる観葉植物の置き換え。

元のモデルは葉のマテリアルが「画像テクスチャ → マテリアル出力」で Principled BSDF を
通しておらず、glTF に KHR_materials_unlit として書き出されていた。three.js では
MeshBasicMaterial になるため光を一切受けず、時間帯を変えても葉だけ同じ色のまま
浮いて見えていた。

作り直しでは (1) マテリアルを必ず BSDF 経由にし、(2) 葉を板ではなく浅い凸レンズに
してある。板のままだと1枚の葉の中で明るさが一定になり、光を受けていても
「貼り付けた絵」に見えてしまうため。
*/

import { useGLTF } from "@react-three/drei";
import type { JSX } from "react";
import type * as THREE from "three";
import type { GLTF } from "three/examples/jsm/Addons.js";

type GLTFResult = GLTF & {
	nodes: {
		EucalyptusStem: THREE.Mesh;
		EucalyptusLeaf: THREE.Mesh;
		EucalyptusPlanter: THREE.Mesh;
		EucalyptusSoil: THREE.Mesh;
	};
	materials: {
		EucalyptusStem: THREE.MeshStandardMaterial;
		EucalyptusLeaf: THREE.MeshStandardMaterial;
		EucalyptusPlanter: THREE.MeshStandardMaterial;
		EucalyptusSoil: THREE.MeshStandardMaterial;
	};
};

/**
 * 棚の左隣のスツールの上。モデルの原点は土の表面なので、
 * 鉢の底（原点から 0.16 下）がスツールの天板 y = 0.199 に乗る高さに置く。
 */
const POSITION: [number, number, number] = [-1.328, 0.359, -1.198];

export function Eucalyptus(props: JSX.IntrinsicElements["group"]) {
	const { nodes, materials } = useGLTF("/eucalyptus.glb") as unknown as GLTFResult;
	return (
		<group position={POSITION} {...props} dispose={null}>
			<mesh
				castShadow
				receiveShadow
				geometry={nodes.EucalyptusPlanter.geometry}
				material={materials.EucalyptusPlanter}
			/>
			<mesh
				receiveShadow
				geometry={nodes.EucalyptusSoil.geometry}
				material={materials.EucalyptusSoil}
			/>
			<mesh
				castShadow
				receiveShadow
				geometry={nodes.EucalyptusStem.geometry}
				material={materials.EucalyptusStem}
			/>
			<mesh
				castShadow
				receiveShadow
				geometry={nodes.EucalyptusLeaf.geometry}
				material={materials.EucalyptusLeaf}
			/>
		</group>
	);
}

useGLTF.preload("/eucalyptus.glb");
