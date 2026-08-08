/**
 * 時間帯ごとのプリセット。
 *
 * issue #35 の方針にあわせて、シームレスな補間ではなく朝/昼/夕/夜の
 * 4パターンを切り替える。背景色は globals.css 側に `:root[data-time="..."]`
 * として持たせ、3D側の光はここの `SCENE_LIGHTING` を使う。
 */

export const TIMES_OF_DAY = ["morning", "day", "evening", "night"] as const;

export type TimeOfDay = (typeof TIMES_OF_DAY)[number];

export function isTimeOfDay(value: string | null): value is TimeOfDay {
	return value !== null && (TIMES_OF_DAY as readonly string[]).includes(value);
}

/** 朝5時〜、昼10時〜、夕16時〜、夜19時〜翌5時。 */
export function getTimeOfDay(date: Date): TimeOfDay {
	const hour = date.getHours();
	if (hour >= 19 || hour < 5) return "night";
	if (hour >= 16) return "evening";
	if (hour >= 10) return "day";
	return "morning";
}

export type SceneLighting = {
	/** 窓の外から差し込む日光（夜は月明かり）。 */
	sunColor: string;
	/**
	 * ライトの位置。ターゲットは原点なので、これがそのまま光の角度になる。
	 * 窓は x = 1.387 の壁にあるため、x は必ず正の値にしておくこと。
	 * 負にすると光が窓を通らず、壁に遮られて何も差し込まなくなる。
	 */
	sunPosition: [number, number, number];
	sunIntensity: number;
	ambientIntensity: number;
	/** 室内灯。夜も点けたままにして、部屋が完全に沈まないようにする。 */
	pointIntensity: number;
	/** 窓の向こうに置いてある板の色。昼は白飛び、夜は暗い空。 */
	skyColor: string;
	skyEmissive: string;
};

export const SCENE_LIGHTING: Record<TimeOfDay, SceneLighting> = {
	morning: {
		sunColor: "#ffd7a8",
		// 低めの朝日。これ以上寝かせると光が床を越えて画面外に抜けてしまうので、
		// 手前側の床に落ちるぎりぎりの角度にしている。
		sunPosition: [5.0, 3.2, -1.6],
		sunIntensity: 2.8,
		ambientIntensity: 0.95,
		pointIntensity: 9,
		skyColor: "#fff4e0",
		skyEmissive: "#ffe9c8",
	},
	day: {
		sunColor: "#fff4e2",
		sunPosition: [5.16, 2.88, -0.96],
		sunIntensity: 3,
		ambientIntensity: 1,
		pointIntensity: 10,
		skyColor: "#ffffff",
		skyEmissive: "#f8fff5",
	},
	evening: {
		sunColor: "#ff9d5c",
		// さらに低く、朝とは逆側から差す。
		sunPosition: [5.52, 1.56, 1.74],
		sunIntensity: 2.6,
		ambientIntensity: 0.8,
		pointIntensity: 9,
		skyColor: "#ffd0a0",
		skyEmissive: "#ffb070",
	},
	night: {
		sunColor: "#8fa6d8",
		sunPosition: [4.32, 3.96, -1.32],
		sunIntensity: 0.7,
		ambientIntensity: 0.5,
		pointIntensity: 9,
		skyColor: "#2b3a5c",
		skyEmissive: "#151d33",
	},
};
