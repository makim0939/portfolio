"use client";
/*
壁掛け時計。Room と同じ glb から描く。

針が実時刻を指すので、Room.tsx に混ぜず別コンポーネントにしてある。
useGLTF は同じパスなら読み込みを共有するので、glb が二重に落ちてくることはない。

針は 12 時を指した状態で作ってあり、オブジェクトの原点は文字盤の中心にある。
そのため Z 軸まわりに回すだけで実時刻を指す。
*/

import { ROOM_GLB, type RoomGLTF } from "@/components/3d/Room";
import { useGLTF } from "@react-three/drei";
import { type JSX, useEffect, useState } from "react";

/** 棚と観葉植物の真上の壁。値は Portfolio2025-Room.blend の WallClock から来ている。 */
const WALL_POSITION: [number, number, number] = [-0.9, 1.62, -1.36];

/** 分針は 1 分で 6 度しか動かないので、この間隔で十分追従する。 */
const TICK_INTERVAL_MS = 15_000;

type HandAngles = { hour: number; minute: number };

function handAngles(date: Date): HandAngles {
	const minutes = date.getMinutes();
	return {
		hour: (((date.getHours() % 12) + minutes / 60) / 12) * Math.PI * 2,
		minute: (minutes / 60) * Math.PI * 2,
	};
}

/**
 * 実時刻から針の角度を返す。サーバ側では時刻が確定しないので 0 時を返すが、
 * この値は DOM に出ない（3Dの見た目にしか効かない）のでハイドレーションの
 * ずれにはならない。
 */
function useHandAngles(): HandAngles {
	const [angles, setAngles] = useState<HandAngles>(() =>
		typeof window === "undefined" ? { hour: 0, minute: 0 } : handAngles(new Date()),
	);

	useEffect(() => {
		const update = () => setAngles(handAngles(new Date()));
		update();
		const id = setInterval(update, TICK_INTERVAL_MS);
		return () => clearInterval(id);
	}, []);

	return angles;
}

export function WallClock(props: JSX.IntrinsicElements["group"]) {
	const { nodes, materials } = useGLTF(ROOM_GLB) as unknown as RoomGLTF;
	const angles = useHandAngles();

	return (
		<group position={WALL_POSITION} {...props} dispose={null}>
			<mesh
				castShadow
				receiveShadow
				geometry={nodes.ClockCase.geometry}
				material={materials.ClockCase}
			/>
			<mesh
				castShadow
				receiveShadow
				geometry={nodes.ClockFace.geometry}
				material={materials.ClockFace}
			/>
			<mesh
				castShadow
				receiveShadow
				geometry={nodes.ClockMarks.geometry}
				material={materials.ClockHand}
			/>
			{/* 時計回りは Z 軸の負方向まわり。 */}
			<mesh
				castShadow
				receiveShadow
				geometry={nodes.ClockHourHand.geometry}
				material={materials.ClockHand}
				rotation={[0, 0, -angles.hour]}
			/>
			<mesh
				castShadow
				receiveShadow
				geometry={nodes.ClockMinuteHand.geometry}
				material={materials.ClockHand}
				rotation={[0, 0, -angles.minute]}
			/>
		</group>
	);
}
