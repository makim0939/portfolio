"use client";
/*
モデルのソース: 3DCG/Objects/EucalyptusPlant (EucalyptusPlant.blend + Objects/Eucalyptus/Relight.py -> Eucalyptus.glb)

portfolio_room_1_1.glb に含まれる観葉植物の置き換え。形は元のモデルのままで、
マテリアルだけ差し替えてある。

元のモデルは葉のマテリアルが「画像テクスチャ → マテリアル出力」で Principled BSDF を
通しておらず、glTF に KHR_materials_unlit として書き出されていた。three.js では
MeshBasicMaterial になるため光を一切受けず、時間帯を変えても葉だけ同じ色のまま
浮いて見えていた。

そこで .blend からの書き出しをやり直し、
  - 葉のマテリアルを 画像テクスチャ → Principled BSDF → 出力 に組み替え
  - unlit のときはテクスチャの色がそのまま出ていたぶん、環境光で沈む差を
    埋めるためテクスチャを 1.7 倍に明るくし、彩度を 0.7 に落として GLB に埋め込み
  - 枝の色を銀灰色（#b6bcaa）に差し替え
してある。ジオメトリと配置は元のまま。

枝の色を変えているのは、元が葉より暗い緑で、葉が光を受けるようになると
枝だけ浮いてしまうため。参考写真のユーカリは枝の方が葉より明るい銀灰色なので
それに合わせている。
*/

import { useGLTF } from "@react-three/drei";
import { type JSX, useLayoutEffect } from "react";
import type * as THREE from "three";

/**
 * 棚の左隣のスツールの上。GLB 側のノードが元の .blend の位置とスケールを
 * そのまま持っているので、ここは元の Room.tsx で親グループに与えていた
 * 位置と同じ値でよい。
 */
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
