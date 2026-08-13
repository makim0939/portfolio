"use client";
/*
issue #41 の出現アニメーションを、部屋のオブジェクト1つずつに配る仕組み。

各オブジェクトを <DropIn objectKey="desk"> で包むと、再生中はその Y 座標に
dropInOffset の値がオフセットとして乗る。包むだけなので、オブジェクト側の
位置・回転・スケールには触らない。

DropInProvider が無いときは素通し（group すら足さない）。トップページは
今のところ Provider を置いていないので、この仕組みを入れても見た目は変わらない。

Provider は必ず <Canvas> の内側に置くこと。react-three-fiber は DOM とは別の
リコンサイラで動いていて、Canvas をまたいだ React コンテキストは届かない。
*/

import {
	type AvatarAppearance,
	type DropInObjectKey,
	type DropInOrder,
	type DropInParams,
	dropInDelays,
	dropInOffset,
} from "@/lib/dropIn";
import { useFrame } from "@react-three/fiber";
import { type ReactNode, createContext, useContext, useMemo, useRef } from "react";
import type * as THREE from "three";

export type DropInRuntime = {
	params: DropInParams;
	delays: Record<DropInObjectKey, number>;
	/** アバターだけは出し方を選べる。AvatarAppear が見る。 */
	avatarAppearance: AvatarAppearance;
	/** 再生を始めた時刻（performance.now() のミリ秒）。 */
	startedAt: number;
};

const DropInContext = createContext<DropInRuntime | null>(null);

/** 再生中なら再生状態を、そうでなければ null を返す。 */
export function useDropInRuntime(): DropInRuntime | null {
	return useContext(DropInContext);
}

/** そのオブジェクトが出始めてからの秒数。負ならまだ出番が来ていない。 */
export function dropInElapsed(runtime: DropInRuntime, objectKey: DropInObjectKey): number {
	return (performance.now() - runtime.startedAt) / 1000 - runtime.delays[objectKey];
}

type DropInProviderProps = {
	params: DropInParams;
	order: DropInOrder;
	avatarAppearance: AvatarAppearance;
	/**
	 * 増やすと最初から再生し直す。ランダム順の並びもこの値を種にするので、
	 * リプレイのたびに違う順番になる。
	 */
	replayCount: number;
	children: ReactNode;
};

export function DropInProvider({
	params,
	order,
	avatarAppearance,
	replayCount,
	children,
}: DropInProviderProps) {
	const runtime = useMemo<DropInRuntime>(
		() => ({
			params,
			delays: dropInDelays(order, params.stagger, replayCount),
			avatarAppearance,
			startedAt: performance.now(),
		}),
		[params, order, avatarAppearance, replayCount],
	);

	return <DropInContext.Provider value={runtime}>{children}</DropInContext.Provider>;
}

type DropInProps = {
	objectKey: DropInObjectKey;
	children: ReactNode;
};

export function DropIn({ objectKey, children }: DropInProps) {
	const runtime = useDropInRuntime();
	// Provider が無ければ何もしない。トップページはこちらを通る。
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
