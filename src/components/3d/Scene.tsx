"use client";
import { AvatarPrototype } from "@/components/3d/AvatarPrototype";
import { useDeviceOrientation } from "@/hooks/useDeviceOrientation";
import { useDoePermission } from "@/hooks/useDoePermission";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import MyCamera from "./MyCamera";
import { Room } from "./Room";

export default function Scene() {
	const { doePermission, checkDoePermission } = useDoePermission();
	const orientation = useDeviceOrientation();
	return (
		<div className=" -m-8 ">
			<div className=" w-[100vw] h-[480px] ">
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
			</div>

			{doePermission && doePermission !== "notSupported" && (
				<button
					type="button"
					onClick={() => checkDoePermission()}
					className=" mx-8 -mt-16 p-2 text-left bg-neutral-50 border border-blue-400 rounded-2xl "
					style={{
						marginBottom: doePermission === "granted" ? 0 : 64,
						opacity: doePermission === "granted" ? 0 : 100,
						transitionDuration: "250ms",
						transitionDelay: "5000ms",
					}}
				>
					{doePermission === "default" && "🎮 ジャイロセンサを有効にしてみる...?"}
					{doePermission === "granted" && "✅ スマホを動かしてみよう"}
					{doePermission === "denied" && "🚫 ジャイロセンサを使うにはブラウザを再起動してください"}
				</button>
			)}
		</div>
	);
}
