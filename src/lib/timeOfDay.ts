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
export const HOUR_BOUNDARIES = {
	morning: 5,
	day: 10,
	evening: 16,
	night: 19,
} as const;

export function getTimeOfDay(date: Date): TimeOfDay {
	const hour = date.getHours();
	if (hour >= HOUR_BOUNDARIES.night || hour < HOUR_BOUNDARIES.morning) return "night";
	if (hour >= HOUR_BOUNDARIES.evening) return "evening";
	if (hour >= HOUR_BOUNDARIES.day) return "day";
	return "morning";
}

/**
 * ハイドレーション前に <html data-time="..."> を確定させるためのインラインスクリプト。
 *
 * ページは静的生成なのでサーバ側では時刻が分からず、マウント後に設定すると
 * 初回描画で一瞬だけ既定値（昼）が見えてしまう。これを head で同期実行して防ぐ。
 * 判定の境界値は上の HOUR_BOUNDARIES から埋め込むので、二重管理にはならない。
 */
export function timeOfDayInitScript(): string {
	const { morning, day, evening, night } = HOUR_BOUNDARIES;
	return `(function(){try{
var q=new URLSearchParams(location.search).get("time");
var t=${JSON.stringify(TIMES_OF_DAY)}.indexOf(q)>=0?q:(function(){
var h=new Date().getHours();
return h>=${night}||h<${morning}?"night":h>=${evening}?"evening":h>=${day}?"day":"morning";})();
document.documentElement.dataset.time=t;
}catch(e){document.documentElement.dataset.time="day";}})();`;
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
	ambientColor: string;
	ambientIntensity: number;
	/**
	 * 室内灯。夜は暖色の弱い灯りを低い位置に置き、寒色の環境光と対比させて
	 * 陰影とコントラストを稼ぐ。
	 */
	pointColor: string;
	pointPosition: [number, number, number];
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
		sunIntensity: 3.0,
		ambientColor: "#eef3ff",
		ambientIntensity: 0.8,
		pointColor: "#fff2e0",
		pointPosition: [0, 5, 1],
		pointIntensity: 9,
		skyColor: "#fff0d0",
		skyEmissive: "#ffe9c8",
	},
	day: {
		sunColor: "#fff4e2",
		sunPosition: [5.16, 2.88, -0.96],
		// 環境光を落として日光との差を広げ、床の光と影をはっきり出す。
		sunIntensity: 3.4,
		ambientColor: "#ffffff",
		ambientIntensity: 0.78,
		pointColor: "#ffffff",
		pointPosition: [0, 5, 1],
		pointIntensity: 9,
		skyColor: "#ffffff",
		skyEmissive: "#f8fff5",
	},
	evening: {
		sunColor: "#fcc097",
		// さらに低く、朝とは逆側から差す。
		sunPosition: [5.52, 1.56, 1.74],
		sunIntensity: 2.6,
		ambientColor: "#ffe4d0",
		ambientIntensity: 0.72,
		pointColor: "#ffe0bb",
		pointPosition: [0, 5, 1],
		pointIntensity: 8,
		skyColor: "#ffd0a0",
		skyEmissive: "#ffb070",
	},
	night: {
		// 月明かり。強くすると明暗境界が顔を横切って縞に見えるため、ごく弱く。
		sunColor: "#8fa6d8",
		sunPosition: [4.32, 3.96, -1.32],
		sunIntensity: 0.35,
		// やや寒色の環境光と暖色の室内灯を組み合わせる。
		// 陰影は環境光で浅く保つ。室内灯を強くして稼ぐ方向は顔に濃い影が出る。
		ambientColor: "#bcc2e0",
		ambientIntensity: 0.7,
		// カメラ側の上方から顔を照らすフィルライト。真上や部屋の奥に置くと
		// アバターの顔が陰になり、月明かりの明暗境界と重なって影が強く出る。
		pointColor: "#ffdbae",
		pointPosition: [-0.8, 3.6, 1.6],
		pointIntensity: 6,
		skyColor: "#3c4973",
		skyEmissive: "#151d33",
	},
};
