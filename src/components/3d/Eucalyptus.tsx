"use client";
/*
モデルのソース: 3DCG/Objects/EucalyptusPlant (EucalyptusPlant.blend + Objects/Eucalyptus/Relight.py -> Eucalyptus.glb)

portfolio_room_1_1.glb に含まれる観葉植物の置き換え。ジオメトリと配置は元のままで、
マテリアルだけ差し替えてある。元は葉が Principled BSDF を通っておらず
KHR_materials_unlit で書き出されていたため、three.js では MeshBasicMaterial になって
光を受けず、時間帯を変えても葉だけ同じ色のまま浮いて見えていた。
枝を銀灰色にしているのは、葉が光を受けるようになると元の暗い緑では枝だけ浮くため。
*/

import { useGLTF } from "@react-three/drei";
import { type JSX, useLayoutEffect } from "react";
import type * as THREE from "three";

/** 棚の左隣のスツールの上。GLB のノードが .blend の位置とスケールを持ったままなので、置き場所だけ与える。 */
const POSITION: [number, number, number] = [-1.328, 0.198, -1.198];

export function Eucalyptus(props: JSX.IntrinsicElements["group"]) {
	const { scene } = useGLTF("/eucalyptus.glb");

	// メッシュ名が元の .blend 由来（日本語・自動生成）で扱いにくいので、
	// ノードを個別に並べずに読み込んだシーンをそのまま置き、影の設定だけ回す。
	useLayoutEffect(() => {
		scene.traverse((object) => {
			if ((object as THREE.Mesh).isMesh) {
				object.castShadow = true;
				object.receiveShadow = true;
			}
		});
	}, [scene]);

	return (
		<group position={POSITION} {...props} dispose={null}>
			<primitive object={scene} />
		</group>
	);
}

useGLTF.preload("/eucalyptus.glb");
