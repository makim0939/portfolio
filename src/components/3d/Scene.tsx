"use client";
import { AvatarPrototype } from "@/components/3d/AvatarPrototype";
import { useDeviceOrientation } from "@/hooks/useDeviceOrientation";
import { useDoePermission } from "@/hooks/useDoePermission";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { MyCamera } from "./MyCamera";
import { Room } from "./Room";
import { useResponsiveBreakpoint } from "@/hooks/useResponsiveBreakpoint";
import { useMousePos } from "@/hooks/useMousePos";

export function Scene() {
	const { doePermission, checkDoePermission } = useDoePermission();
	const orientation = useDeviceOrientation();
	const mousePos = useMousePos(doePermission !== null && doePermission === "notSupported");
	const responsive = useResponsiveBreakpoint();

	// PC版
	if (responsive === "lg")
		return (
			<div className=" -mx-8 p-16 fixed w-[50vw] h-[50vw] top-1/2 right-0 -translate-y-1/2 -z-10 ">
				<Canvas shadows orthographic>
					<Suspense fallback={null}>
						<MyCamera />
						<ambientLight position={[0, 5, 0]} intensity={1} />
						<pointLight position={[0, 5, 1]} intensity={10} />
						<group
							rotation={[
								Math.PI * (mousePos.y * 0.1),
								Math.PI * (mousePos.x * 0.25),
								Math.PI * (mousePos.y * 0.1),
							]}
						>
							<AvatarPrototype />
							<Room />
						</group>
					</Suspense>
				</Canvas>
			</div>
		);

	// モバイル版
	return (
		<>
			<div className="relative w-[100vw] h-[100vw] -mt-24 mb-8 -mx-8 ">
				<div className=" absolute w-full h-[128%] -top-4 left-0 -z-10 ">
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
