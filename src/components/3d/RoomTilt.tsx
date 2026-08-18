"use client";
/*
部屋の傾き。マウスの位置や端末の傾きに追従させる。

回転は React の props ではなく、ここの useFrame から group に直接書く。
props で渡すには入力を state に持つ必要があり、そうすると毎フレーム部屋のツリーが
作り直されて、glb を読み終えた直後のいちばん重い場面でコマ落ちするため。
*/

import type { TiltAmplitude, TiltInput } from "@/hooks/useRoomTilt";
import { makeSmooth } from "@/lib/animationTools";
import { useFrame } from "@react-three/fiber";
import { type ReactNode, type RefObject, useRef } from "react";
import type * as THREE from "three";

/** 1フレームで目標の傾きにどれだけ近づくか。小さいほどゆっくり追う。 */
const SMOOTHING = 0.05;

type RoomTiltProps = {
	tilt: RefObject<TiltInput>;
	amplitude: TiltAmplitude;
	children: ReactNode;
};

export function RoomTilt({ tilt, amplitude, children }: RoomTiltProps) {
	const ref = useRef<THREE.Group>(null);

	useFrame(() => {
		const group = ref.current;
		if (!group) return;
		// 上下の入力を X と Z の両方に配ると、部屋の角を軸に覗き込むような傾き方になる
		const pitch = Math.PI * tilt.current.y * amplitude.pitch;
		const yaw = Math.PI * tilt.current.x * amplitude.yaw;
		group.rotation.x = makeSmooth(group.rotation.x, pitch, SMOOTHING);
		group.rotation.y = makeSmooth(group.rotation.y, yaw, SMOOTHING);
		group.rotation.z = makeSmooth(group.rotation.z, pitch, SMOOTHING);
	});

	return <group ref={ref}>{children}</group>;
}
