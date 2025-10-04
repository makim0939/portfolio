"use client";
import { AvatarPrototype } from "@/components/3d/AvatarPrototype";
import { useDeviceOrientation } from "@/hooks/useDeviceOrientation";
import { useDoePermission } from "@/hooks/useDoePermission";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { MyCamera } from "./MyCamera";
import { Room } from "./Room";
import { useResponsiveBreakpoint } from "@/hooks/useResponsiveBreakpoint";

export function Scene() {
	const orientation = useDeviceOrientation();
	return (
		<div className="relative w-[100vw] h-[100vw] -mt-16 ">
			<div className=" absolute w-full h-full -top-4 left-0 -z-10 -mx-8  ">
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
		</div>
	);
}

export function DoePermissionButton() {
	const { doePermission, checkDoePermission } = useDoePermission();
	return (
		<>
			{doePermission && doePermission !== "notSupported" && (
				<button
					type="button"
					onClick={() => checkDoePermission()}
					className=" p-2 z-10 text-left bg-neutral-50 border border-blue-400 rounded-2xl "
					style={{
						marginTop: doePermission === "granted" ? -64 : 0,
						marginBottom: doePermission === "granted" ? -64 : 16,
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
		</>
	);
}
