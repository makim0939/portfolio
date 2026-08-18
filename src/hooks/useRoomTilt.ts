"use client";
import { type RefObject, useEffect, useRef } from "react";

/** 部屋を傾ける入力。画面いっぱい・端末いっぱいで概ね -0.5〜0.5 になるよう均してある。 */
export type TiltInput = { x: number; y: number };

/** 入力1に対して部屋を何 π ラジアン傾けるか。 */
export type TiltAmplitude = { pitch: number; yaw: number };

export type TiltSource = "mouse" | "orientation";

/**
 * 傾きの効き具合。
 *
 * マウスは画面の端から端まで動かせるが、端末の傾きは持ち方の範囲でしか振れないので、
 * 上下（pitch）の振り幅だけ端末側を控えめにしてある。
 */
export const TILT_AMPLITUDE: Record<TiltSource, TiltAmplitude> = {
	mouse: { pitch: 0.1, yaw: 0.25 },
	orientation: { pitch: 0.075, yaw: 0.25 },
};

/** 端末を少し手前に倒した姿勢を正面として扱う（度）。 */
const ORIENTATION_NEUTRAL_BETA = 30;

/**
 * 部屋を傾ける入力を集める。
 *
 * 値は state ではなく ref に貯める。マウスの追従は毎フレーム値が動くので、state に
 * すると部屋の React ツリー（メッシュ30個ぶん）が毎フレーム作り直されてしまい、
 * glb を読み終えた直後のいちばん重い場面でコマ落ちする。
 * 実際に傾けるのは Canvas の中の RoomTilt で、毎フレームここの ref を読む。
 */
export function useRoomTilt(source: TiltSource): RefObject<TiltInput> {
	const tilt = useRef<TiltInput>({ x: 0, y: 0 });

	useEffect(() => {
		if (source === "mouse") {
			const onMouseMove = (event: MouseEvent) => {
				tilt.current = {
					x: (event.clientX - window.innerWidth / 2) / window.innerWidth,
					y: (event.clientY - window.innerHeight / 2) / window.innerHeight,
				};
			};
			window.addEventListener("mousemove", onMouseMove);
			return () => window.removeEventListener("mousemove", onMouseMove);
		}

		const onOrientation = (event: DeviceOrientationEvent) => {
			tilt.current = {
				x: (event.gamma ?? 0) / 90,
				y: ((event.beta ?? 0) - ORIENTATION_NEUTRAL_BETA) / 90,
			};
		};
		// 取り外すときも同じ capture を渡さないと外れない
		window.addEventListener("deviceorientation", onOrientation, true);
		return () => window.removeEventListener("deviceorientation", onOrientation, true);
	}, [source]);

	return tilt;
}
