"use client";
import { AvatarPrototype } from "@/components/3d/AvatarPrototype";
import { useDeviceOrientation } from "@/hooks/useDeviceOrientation";
import { useDoePermission } from "@/hooks/useDoePermission";
import { useMousePos } from "@/hooks/useMousePos";
import { useResponsiveBreakpoint } from "@/hooks/useResponsiveBreakpoint";
import { useTimeOfDay } from "@/hooks/useTimeOfDay";
import { SCENE_LIGHTING, type SceneLighting } from "@/lib/timeOfDay";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { MyCamera } from "./MyCamera";
import { Room } from "./Room";
import { RoomWalls } from "./RoomWalls";
import { WallClock } from "./WallClock";

/**
 * 部屋の中身と照明。PC版・モバイル版で傾け方だけが違うので、rotation を受け取る。
 * 光の色・角度・強さは時間帯のプリセットから引く（issue #35）。
 */
function RoomScene({
	rotation,
	lighting,
}: { rotation: [number, number, number]; lighting: SceneLighting }) {
	return (
		<>
			<ambientLight color={lighting.ambientColor} intensity={lighting.ambientIntensity} />
			<pointLight
				position={lighting.pointPosition}
				color={lighting.pointColor}
				intensity={lighting.pointIntensity}
			/>
			<group rotation={rotation}>
				{/*
					窓から差し込む日光。回転グループの内側に置いてある。
					グループは原点まわりに回り、ライトのターゲットは原点なので、
					部屋を傾けても窓と光の位置関係が変わらない。
				*/}
				<directionalLight
					position={lighting.sunPosition}
					intensity={lighting.sunIntensity}
					color={lighting.sunColor}
					castShadow
					shadow-mapSize={[2048, 2048]}
					shadow-camera-near={0.5}
					shadow-camera-far={16}
					shadow-camera-left={-3}
					shadow-camera-right={3}
					shadow-camera-top={3}
					shadow-camera-bottom={-3}
					shadow-bias={-0.0006}
					shadow-normalBias={0.02}
				/>
				<AvatarPrototype />
				<Room />
				<RoomWalls skyColor={lighting.skyColor} skyEmissive={lighting.skyEmissive} />
				<WallClock />
			</group>
		</>
	);
}

export function Scene() {
	const { doePermission, checkDoePermission } = useDoePermission();
	const orientation = useDeviceOrientation();
	const mousePos = useMousePos(doePermission !== null && doePermission === "notSupported");
	const responsive = useResponsiveBreakpoint();
	const lighting = SCENE_LIGHTING[useTimeOfDay()];

	// PC版
	if (responsive === "lg")
		return (
			<div className=" -mx-8 p-16 fixed w-[50vw] h-[50vw] top-1/2 right-0 -translate-y-1/2 -z-10 ">
				<Canvas shadows orthographic>
					<Suspense fallback={null}>
						<MyCamera />
						<RoomScene
							lighting={lighting}
							rotation={[
								Math.PI * (mousePos.y * 0.1),
								Math.PI * (mousePos.x * 0.25),
								Math.PI * (mousePos.y * 0.1),
							]}
						/>
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
							<RoomScene
								lighting={lighting}
								rotation={[
									Math.PI * (((orientation.beta - 30) / 90) * 0.075),
									Math.PI * ((orientation.gamma / 90) * 0.25),
									Math.PI * (((orientation.beta - 30) / 90) * 0.075),
								]}
							/>
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
