"use client";
/*
出現アニメーションを、部屋のオブジェクト1つずつに配る仕組み。

各オブジェクトを <DropIn objectKey="desk"> で包むと、再生中はその Y 座標に
dropInOffset の値がオフセットとして乗る。包むだけなので、オブジェクト側の
位置・回転・スケールには触らない。

DropInProvider が無いときは素通し（group すら足さない）。トップページは初回表示の
ときだけ Provider を置くので、二度目以降は演出のコードが一切走らない。

始めてよいかどうかは started で切り替える。Provider を後から差し込む形にすると、
その位置のコンポーネントの型が変わって部屋とアバターがまるごと作り直され、
いちばん見せたい瞬間にそのぶんの重さが乗ってしまうため。

Provider は必ず <Canvas> の内側に置くこと。react-three-fiber は DOM とは別の
リコンサイラで動いていて、Canvas をまたいだ React コンテキストは届かない。
*/

import { type DropInObjectKey, type DropInParams, dropInDelays, dropInOffset } from "@/lib/dropIn";
import { useFrame } from "@react-three/fiber";
import { type ReactNode, type RefObject, createContext, useContext, useMemo, useRef } from "react";
import type * as THREE from "three";

type DropInRuntime = {
	params: DropInParams;
	delays: Record<DropInObjectKey, number>;
	/** 再生を始めた時刻（performance.now() のミリ秒）。null なら、まだ1フレームも描いていない。 */
	startedAt: RefObject<number | null>;
	/** 演出を始めてよいか。false の間は最終位置のまま描く。 */
	started: boolean;
};

const DropInContext = createContext<DropInRuntime | null>(null);

/** そのオブジェクトが出始めてからの秒数。負ならまだ出番が来ていない。 */
function dropInElapsed(runtime: DropInRuntime, objectKey: DropInObjectKey): number {
	/*
		時計が動き出すのは、React が描画を組んだ時ではなく最初のフレームを描く時。
		render の時刻で始めてしまうと、ジオメトリを GPU に載せてシェーダを組み立てている
		間にも演出だけが進み、最初に目に入った時点で途中まで飛んでいることになる。
	*/
	if (runtime.startedAt.current === null) runtime.startedAt.current = performance.now();
	return (performance.now() - runtime.startedAt.current) / 1000 - runtime.delays[objectKey];
}

type DropInProviderProps = {
	params: DropInParams;
	/** 絵が出そろって、演出を始めてよくなったか。 */
	started: boolean;
	children: ReactNode;
};

export function DropInProvider({ params, started, children }: DropInProviderProps) {
	// started が切り替わっても再生開始の時刻は持ち越す
	const startedAt = useRef<number | null>(null);
	// params は定数なので、作り直されるのは一度だけ
	const delays = useMemo(() => dropInDelays(params.stagger), [params.stagger]);
	const runtime = useMemo<DropInRuntime>(
		() => ({ params, delays, startedAt, started }),
		[params, delays, started],
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
		// 始まるまでは最終位置のまま。ここで一度描いておくと、演出が始まるフレームには
		// ジオメトリもシェーダも影も出来上がっている
		if (!runtime.started) {
			group.visible = true;
			group.position.y = 0;
			return;
		}
		const elapsed = dropInElapsed(runtime, objectKey);
		// 落下開始まではそもそも出さない。空中に浮いたまま待つと種明かしになってしまう
		group.visible = elapsed >= 0;
		group.position.y = dropInOffset(elapsed, runtime.params);
	});

	// useFrame が回る前の1フレームで所定の位置に見えてしまわないよう、初期値も入れておく
	return (
		<group
			ref={ref}
			position-y={runtime.started ? runtime.params.height : 0}
			visible={!runtime.started}
		>
			{children}
		</group>
	);
}
