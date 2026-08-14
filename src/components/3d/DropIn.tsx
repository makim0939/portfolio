"use client";
/*
出現アニメーションを、部屋のオブジェクト1つずつに配る仕組み。

各オブジェクトを <DropIn objectKey="desk"> で包むと、再生中はその Y 座標に
dropInOffset の値がオフセットとして乗る。包むだけなので、オブジェクト側の
位置・回転・スケールには触らない。

DropInProvider が無いときは素通し（group すら足さない）。トップページは初回表示の
ときだけ Provider を置くので、二度目以降は演出のコードが一切走らない。

Provider は必ず <Canvas> の内側に置くこと。react-three-fiber は DOM とは別の
リコンサイラで動いていて、Canvas をまたいだ React コンテキストは届かない。
*/

import { type DropInObjectKey, type DropInParams, dropInDelays, dropInOffset } from "@/lib/dropIn";
import { useFrame } from "@react-three/fiber";
import { type ReactNode, createContext, useContext, useMemo, useRef } from "react";
import type * as THREE from "three";

type DropInRuntime = {
	params: DropInParams;
	delays: Record<DropInObjectKey, number>;
	/** 再生を始めた時刻（performance.now() のミリ秒）。 */
	startedAt: number;
};

const DropInContext = createContext<DropInRuntime | null>(null);

/** そのオブジェクトが出始めてからの秒数。負ならまだ出番が来ていない。 */
function dropInElapsed(runtime: DropInRuntime, objectKey: DropInObjectKey): number {
	return (performance.now() - runtime.startedAt) / 1000 - runtime.delays[objectKey];
}

export function DropInProvider({
	params,
	children,
}: { params: DropInParams; children: ReactNode }) {
	// 再生開始の時刻はここで決まる。params は定数なので、作り直されるのは一度だけ
	const runtime = useMemo<DropInRuntime>(
		() => ({
			params,
			delays: dropInDelays(params.stagger),
			startedAt: performance.now(),
		}),
		[params],
	);

	return <DropInContext.Provider value={runtime}>{children}</DropInContext.Provider>;
}

type DropInProps = {
	objectKey: DropInObjectKey;
	children: ReactNode;
};

export function DropIn({ objectKey, children }: DropInProps) {
	const runtime = useContext(DropInContext);
	if (!runtime) return <>{children}</>;
	return (
		<DropInGroup runtime={runtime} objectKey={objectKey}>
			{children}
		</DropInGroup>
	);
}

function DropInGroup({ runtime, objectKey, children }: DropInProps & { runtime: DropInRuntime }) {
	const ref = useRef<THREE.Group>(null);

	useFrame(() => {
		const group = ref.current;
		if (!group) return;
		const elapsed = dropInElapsed(runtime, objectKey);
		// 落下開始まではそもそも出さない。空中に浮いたまま待つと種明かしになってしまう
		group.visible = elapsed >= 0;
		group.position.y = dropInOffset(elapsed, runtime.params);
	});

	// useFrame が回る前の1フレームで所定の位置に見えてしまわないよう、初期値も入れておく
	return (
		<group ref={ref} position-y={runtime.params.height} visible={false}>
			{children}
		</group>
	);
}
