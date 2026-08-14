"use client";
import { AvatarPrototype } from "@/components/3d/AvatarPrototype";
import { DropIn, DropInProvider } from "@/components/3d/DropIn";
import { useDeviceOrientation } from "@/hooks/useDeviceOrientation";
import { useDoePermission } from "@/hooks/useDoePermission";
import { useMousePos } from "@/hooks/useMousePos";
import { useResponsiveBreakpoint } from "@/hooks/useResponsiveBreakpoint";
import { useTimeOfDay } from "@/hooks/useTimeOfDay";
import { DEFAULT_DROP_IN_PARAMS } from "@/lib/dropIn";
import { SCENE_LIGHTING, type SceneLighting } from "@/lib/timeOfDay";
import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useState } from "react";
import { MyCamera } from "./MyCamera";
import { Room } from "./Room";
import { RoomWalls } from "./RoomWalls";
import { WallClock } from "./WallClock";

/**
 * 部屋の中身と照明。PC版・モバイル版で傾け方だけが違うので、rotation を受け取る。
 *
 * オブジェクトを包んでいる DropIn は、上位に DropInProvider が無ければ素通しになる。
 * 出現アニメーションを付けるかどうかは RoomSceneWithIntro が決める。
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
					窓から差し込む日光。グループもライトのターゲットも原点まわりなので、
					内側に置いておけば部屋を傾けても窓と光の位置関係が変わらない。
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
				{/* アバターも家具と同じに落とす。いずれ出現専用のモーションに差し替える想定 */}
				<DropIn objectKey="avatar">
					<AvatarPrototype />
				</DropIn>
				<Room />
				<DropIn objectKey="walls">
					<RoomWalls skyColor={lighting.skyColor} skyEmissive={lighting.skyEmissive} />
				</DropIn>
				<DropIn objectKey="wallClock">
					<WallClock />
				</DropIn>
			</group>
		</>
	);
}

/**
 * 出現アニメーションを再生済みかどうか。
 *
 * 「初回表示のみ」なので、他のページから戻ってくるたびに部屋が組み直されると
 * うるさい。モジュール変数にしておくと、サイト内の遷移では読み込み直されないので
 * 二度目からは静かなまま出る。読み込み直せば（リロード・別タブ）また再生される。
 */
let introPlayed = false;

function useIntro(): boolean {
	// 判定は描画時に読むだけ。フラグを立てるのは commit 後の effect でやる。
	// 読み込み待ちで描画が捨てられても、再生し損ねないようにするため
	const [play] = useState(() => !introPlayed);

	useEffect(() => {
		introPlayed = true;
	}, []);

	return play;
}

type RoomSceneProps = { rotation: [number, number, number]; lighting: SceneLighting };

/**
 * 初回表示のときだけ出現アニメーション付きで部屋を出す。
 *
 * DropInProvider は Suspense の内側に置くこと。glb の読み込みで描画が一度捨てられると
 * commit したときの時刻で再生が始まるので、モデルが出そろう前に演出だけ進んでしまう
 * ことがない。外側に置くと、読み込みの間に再生が終わってしまう。
 */
function RoomSceneWithIntro(props: RoomSceneProps) {
	if (!useIntro()) return <RoomScene {...props} />;

	return (
		<DropInProvider params={DEFAULT_DROP_IN_PARAMS}>
			<RoomScene {...props} />
		</DropInProvider>
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
						<RoomSceneWithIntro
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
							<RoomSceneWithIntro
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
