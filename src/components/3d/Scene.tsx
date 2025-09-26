"use client";
import { AvatarPrototype } from "@/components/3d/AvatarPrototype";
import { useDeviceOrientation } from "@/hooks/useDeviceOrientation";
import useDeviceType from "@/hooks/useDeviceType";
import { useDoePermission } from "@/hooks/useDoePermission";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import MyCamera from "./MyCamera";
import { Room } from "./Room";

export default function Scene() {
	const deviceType = useDeviceType();
	const { doePermission, checkDoePermission } = useDoePermission();
	const orientation = useDeviceOrientation();
	return (
		<div className=" w-[100vw] h-[480px] -m-8 md:-m-16 mb-16 ">
			<Canvas shadows orthographic>
				<Suspense fallback={null}>
					<MyCamera />
					<ambientLight position={[0, 5, 0]} intensity={1} />
					<pointLight position={[0, 5, 1]} intensity={10} />
					<group
						rotation={[
							Math.PI * (((orientation.beta - 30) / 90) * 0.075),
							Math.PI * ((orientation.gamma / 90) * 0.25),
							Math.PI * (((orientation.beta - 30) / 90) * 0.075),
						]}
					>
						<AvatarPrototype />
						<Room />
					</group>
				</Suspense>
			</Canvas>
			{deviceType === "iosOver13" && (
				<button
					type="button"
					onClick={() => checkDoePermission()}
					disabled={doePermission ?? false}
					className=" mx-8 -mt-16 p-2 bg-neutral-50 border border-blue-400 rounded-2xl "
				>
					{doePermission
						? "✅ スマホを動かしてみよう"
						: "🎮 ジャイロセンサを有効にしてみる...?"}
				</button>
			)}
		</div>
	);
}
