"use client";
import { AvatarPrototype } from "@/components/3d/AvatarPrototype";
import { DropIn, DropInProvider } from "@/components/3d/DropIn";
import { RoomTilt } from "@/components/3d/RoomTilt";
import { useDoePermission } from "@/hooks/useDoePermission";
import { useResponsiveBreakpoint } from "@/hooks/useResponsiveBreakpoint";
import {
	TILT_AMPLITUDE,
	type TiltAmplitude,
	type TiltInput,
	useRoomTilt,
} from "@/hooks/useRoomTilt";
import { useTimeOfDay } from "@/hooks/useTimeOfDay";
import { DEFAULT_DROP_IN_PARAMS } from "@/lib/dropIn";
import { SCENE_LIGHTING, type SceneLighting } from "@/lib/timeOfDay";
import { Preload } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { type RefObject, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { MyCamera } from "./MyCamera";
import { Room } from "./Room";
import { RoomWalls } from "./RoomWalls";
import { WallClock } from "./WallClock";

/** 絵が出そろうまで、見せないまま描いておくフレーム数。 */
const WARM_UP_FRAMES = 3;

/** 出そろってから部屋を見せるまでの時間（ミリ秒）。落下演出と重なる。 */
const FADE_IN_MS = 400;

/**
 * 部屋の中身と照明。
 *
 * オブジェクトを包んでいる DropIn は、上位に DropInProvider が無ければ素通しになる。
 * 出現アニメーションを付けるかどうかは RoomSceneWithIntro が決める。
 */
function RoomScene({ tilt, amplitude, lighting }: RoomSceneProps) {
	return (
		<>
			<ambientLight color={lighting.ambientColor} intensity={lighting.ambientIntensity} />
			<pointLight
				position={lighting.pointPosition}
				color={lighting.pointColor}
				intensity={lighting.pointIntensity}
			/>
			<RoomTilt tilt={tilt} amplitude={amplitude}>
				{/*
					窓から差し込む日光。傾けるグループもライトのターゲットも原点まわりなので、
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
			</RoomTilt>
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

type RoomSceneProps = {
	tilt: RefObject<TiltInput>;
	amplitude: TiltAmplitude;
	lighting: SceneLighting;
};

/**
 * 絵が出そろったことを知らせる。
 *
 * glb を読み終えた直後の数フレームは、ジオメトリを GPU に載せ、マテリアルぶんの
 * シェーダを組み立て、影を焼き込むのに時間を食う。ここを黙って通り過ぎるまで
 * Canvas は透明のままにしておき、落下演出も始めない。
 */
function WarmUp({ onWarm }: { onWarm: () => void }) {
	const drawn = useRef(0);

	useFrame(() => {
		if (drawn.current >= WARM_UP_FRAMES) return;
		drawn.current += 1;
		if (drawn.current === WARM_UP_FRAMES) onWarm();
	});

	return null;
}

/**
 * 初回表示のときだけ出現アニメーション付きで部屋を出す。
 *
 * warm になるまでは Provider を置いたまま演出だけ止めておく。絵が出そろってから
 * 落とし始めたいが、そこで Provider を差し込む形にすると、その位置のコンポーネントの
 * 型が変わって部屋とアバターがまるごと作り直されてしまう。
 */
function RoomSceneWithIntro({ warm, ...props }: RoomSceneProps & { warm: boolean }) {
	const intro = useIntro();
	if (!intro) return <RoomScene {...props} />;

	return (
		<DropInProvider params={DEFAULT_DROP_IN_PARAMS} started={warm}>
			<RoomScene {...props} />
		</DropInProvider>
	);
}

export function Scene() {
	const { doePermission, checkDoePermission } = useDoePermission();
	const lighting = SCENE_LIGHTING[useTimeOfDay()];
	// 傾けかたの切り替えだけに使う。DOM には出ないので、初期値との差が画面に響かない
	const isDesktop = useResponsiveBreakpoint() === "lg";
	const tiltSource = isDesktop ? "mouse" : "orientation";
	const tilt = useRoomTilt(tiltSource);
	const [warm, setWarm] = useState(false);
	const handleWarm = useCallback(() => setWarm(true), []);

	return (
		<>
			{/*
				置き場所は CSS だけで決める。画面幅を JS で測ってから組み替えると、最初の描画は
				必ずモバイル版になり、PC では本文が画面1枚ぶん跳ねたうえに Canvas が作り直される。
				外側はモバイルで部屋のぶんの場所を取るための枠で、PC では場所を取らない。
			*/}
			<div className=" relative w-[100vw] h-[100vw] -mt-24 mb-8 -mx-8 lg:w-0 lg:h-0 lg:m-0 ">
				<div
					className="
						absolute w-full h-[128%] -top-4 left-0 -z-10
						lg:fixed lg:w-[50vw] lg:h-[50vw] lg:top-1/2 lg:left-auto lg:right-0
						lg:-translate-y-1/2 lg:p-16 lg:-mx-8
					"
					// 絵が出そろうまでは伏せておく。組み上がる途中や、カメラが動く前の1枚を見せない
					style={{ opacity: warm ? 1 : 0, transition: `opacity ${FADE_IN_MS}ms ease-out` }}
				>
					<Canvas shadows orthographic>
						<Suspense fallback={null}>
							<MyCamera />
							<RoomSceneWithIntro
								warm={warm}
								tilt={tilt}
								amplitude={TILT_AMPLITUDE[tiltSource]}
								lighting={lighting}
							/>
							{/* シェーダの組み立てを最初のフレームまで持ち越さない */}
							<Preload all />
							<WarmUp onWarm={handleWarm} />
						</Suspense>
					</Canvas>
				</div>
			</div>
			{!isDesktop && doePermission && doePermission !== "notSupported" && (
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
